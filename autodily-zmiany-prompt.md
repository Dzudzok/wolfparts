# AutoDíly — Prompt do zmian w istniejącym projekcie

Projekt jest już zbudowany. Wprowadź poniższe zmiany — nie przebudowuj tego co działa.

---

## KONTEKST — dlaczego zmiany

Nie mamy bezpośredniego dostępu do bazy MSSQL Nextis z zewnątrz.
Dane produktów będą dostarczane przez pliki CSV eksportowane przez Nextis ERP na FTP.
Aktualne ceny i stany pobieramy on-demand przez REST API Nextis przy otwarciu produktu.

---

## ZMIANA 1 — lib/db.ts → lib/ftp.ts

**Usuń** `lib/db.ts` (klient MSSQL — nie będzie używany).

**Utwórz** `lib/ftp.ts` — klient do pobierania CSV z FTP:

```typescript
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

const FTP_CONFIG = {
  host: process.env.FTP_HOST!,
  user: process.env.FTP_USER!,
  password: process.env.FTP_PASSWORD!,
  secure: false,
};

// Pobiera zawartość pliku z FTP jako string
export async function fetchFileFromFTP(remotePath: string): Promise<string> {
  const client = new ftp.Client();
  try {
    await client.access(FTP_CONFIG);
    const chunks: Buffer[] = [];
    const writable = new (require('stream').Writable)({
      write(chunk: Buffer, _: string, cb: () => void) {
        chunks.push(chunk);
        cb();
      }
    });
    await client.downloadTo(writable, remotePath);
    return Buffer.concat(chunks).toString('utf-8');
  } finally {
    client.close();
  }
}

// Listuje pliki w katalogu FTP
export async function listFTPFiles(remotePath: string): Promise<string[]> {
  const client = new ftp.Client();
  try {
    await client.access(FTP_CONFIG);
    const files = await client.list(remotePath);
    return files.map(f => f.name);
  } finally {
    client.close();
  }
}
```

Zainstaluj: `npm install basic-ftp`

---

## ZMIANA 2 — lib/sync.ts — zastąp źródło MSSQL parserem CSV

Przepisz `lib/sync.ts` żeby pobierał dane z FTP zamiast MSSQL.
Zachowaj całą logikę transformacji i uploadu do Typesense — tylko zmień skąd pobierasz dane.

### Format CSV (separator `;`, wartości w cudzysłowach)

**Plik główny produktów** (eksportowany raz dziennie przez ERP):
```
"ProductID";"ProductCode";"Name";"Description";"EshopDescription";"Brand";
"BrandGroup";"Category";"AssortmentName";"RetailPriceMin";"RetailPriceMax";
"PurchasePrice";"VATRate";"IsSale";"IsHiddenOnEshop";"ImageURL";"TotalStock";
"OEMNumbers";"EANCodes";"CrossNumbers"
```

**Plik stanów/cen** (eksportowany co godzinę przez ERP, tylko zmiany):
```
"ProductID";"RetailPriceMin";"RetailPriceMax";"TotalStock"
```

### Nowa logika sync.ts:

```typescript
import { fetchFileFromFTP } from './ftp';
import { parse } from 'csv-parse/sync';
import { getTypesenseAdminClient, productsSchema } from './typesense';

const FTP_PRODUCTS_PATH = process.env.FTP_PRODUCTS_PATH || '/exports/produkty.csv';
const FTP_STOCKS_PATH = process.env.FTP_STOCKS_PATH || '/exports/stany.csv';

function parsePrice(val: string): number {
  if (!val || val === '') return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
}

function parsePipeList(val: string): string[] {
  if (!val || val === '') return [];
  return val.split('|').filter(Boolean);
}

// Pełny sync produktów z pliku CSV
export async function syncProductsFromCSV(limit?: number): Promise<void> {
  const startTime = Date.now();
  console.log('📥 Pobieranie CSV z FTP...');

  const csvContent = await fetchFileFromFTP(FTP_PRODUCTS_PATH);

  const records = parse(csvContent, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
  });

  console.log(`📦 Wczytano ${records.length} produktów z CSV`);

  const items = limit ? records.slice(0, limit) : records;
  const client = getTypesenseAdminClient();
  const BATCH = 1000;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    const docs = batch.map((r: any) => ({
      id:             String(r.ProductID),
      product_code:   r.ProductCode || '',
      name:           r.Name || '',
      description:    r.Description || '',
      brand:          r.Brand || '',
      brand_group:    r.BrandGroup || '',
      category:       r.Category || '',
      assortment:     r.AssortmentName || '',
      price_min:      parsePrice(r.RetailPriceMin),
      price_max:      parsePrice(r.RetailPriceMax),
      purchase_price: parsePrice(r.PurchasePrice),
      in_stock:       parsePrice(r.TotalStock) > 0,
      stock_qty:      parsePrice(r.TotalStock),
      is_sale:        r.IsSale === '1' || r.IsSale === true,
      image_url:      r.ImageURL || '',
      oem_numbers:    parsePipeList(r.OEMNumbers),
      ean_codes:      parsePipeList(r.EANCodes),
      cross_numbers:  parsePipeList(r.CrossNumbers),
      updated_at:     Date.now(),
    }));

    await client
      .collections('products')
      .documents()
      .import(docs, { action: 'upsert' });

    console.log(`✅ Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(items.length/BATCH)} — ${i+batch.length}/${items.length}`);
  }

  console.log(`✅ Sync zakończony — ${items.length} produktów — ${((Date.now()-startTime)/1000).toFixed(1)}s`);
}

// Delta sync — tylko stany i ceny (z mniejszego pliku co-godzinnego)
export async function syncStocksFromCSV(): Promise<void> {
  console.log('📥 Pobieranie stanów z FTP...');

  const csvContent = await fetchFileFromFTP(FTP_STOCKS_PATH);

  const records = parse(csvContent, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
  });

  console.log(`📦 Aktualizacja ${records.length} stanów...`);

  const client = getTypesenseAdminClient();
  const BATCH = 1000;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const docs = batch.map((r: any) => ({
      id:        String(r.ProductID),
      price_min: parsePrice(r.RetailPriceMin),
      price_max: parsePrice(r.RetailPriceMax),
      in_stock:  parsePrice(r.TotalStock) > 0,
      stock_qty: parsePrice(r.TotalStock),
      updated_at: Date.now(),
    }));

    await client
      .collections('products')
      .documents()
      .import(docs, { action: 'update' });
  }

  console.log(`✅ Stany zaktualizowane — ${records.length} produktów`);
}
```

Zainstaluj: `npm install csv-parse`

---

## ZMIANA 3 — scripts/sync-products.ts

Zaktualizuj script żeby używał nowych funkcji:

```typescript
import { syncProductsFromCSV, syncStocksFromCSV } from '../lib/sync';

const args = process.argv.slice(2);
const limit = args.includes('--limit')
  ? parseInt(args[args.indexOf('--limit') + 1])
  : undefined;
const stocksOnly = args.includes('--stocks-only');

async function main() {
  if (stocksOnly) {
    await syncStocksFromCSV();
  } else {
    await syncProductsFromCSV(limit);
  }
}

main().catch(console.error);
```

Zaktualizuj `package.json`:
```json
"sync:full":   "tsx scripts/sync-products.ts",
"sync:test":   "tsx scripts/sync-products.ts --limit 500",
"sync:stocks": "tsx scripts/sync-products.ts --stocks-only"
```

---

## ZMIANA 4 — app/api/sync/route.ts

Zaktualizuj webhook żeby obsługiwał dwa tryby:

```typescript
// POST /api/sync
// Body: { type: 'full' | 'stocks', secret: string }

import { syncProductsFromCSV, syncStocksFromCSV } from '@/lib/sync';

export async function POST(req: Request) {
  const { type, secret } = await req.json();

  if (secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Odpal async bez czekania na zakończenie
  if (type === 'stocks') {
    syncStocksFromCSV().catch(console.error);
    return Response.json({ status: 'stocks sync started' });
  } else {
    syncProductsFromCSV().catch(console.error);
    return Response.json({ status: 'full sync started' });
  }
}
```

---

## ZMIANA 5 — app/api/product-live/route.ts

Upewnij się że live endpoint działa poprawnie.
Sprawdź czy poniższa logika jest zaimplementowana — jeśli nie, popraw:

```typescript
// GET /api/product-live?id=12345
// Zwraca aktualną cenę i stan z Nextis REST API

import { checkItemsByID } from '@/lib/nextis-api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  try {
    const items = await checkItemsByID([parseInt(id)]);
    const item = items[0]?.responseItem;

    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

    return Response.json({
      price:         item.Price?.UnitPrice ?? 0,
      priceIncVAT:   item.Price?.UnitPriceIncVAT ?? 0,
      priceRetail:   item.Price?.UnitPriceRetail ?? 0,
      discount:      item.Price?.Discount ?? 0,
      currency:      item.Price?.Currency ?? 'CZK',
      qty:           item.QtyAvailableMain ?? 0,
      inStock:       (item.QtyAvailableMain ?? 0) > 0,
      valid:         item.Price?.Valid ?? false,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // cache 5 minut
      }
    });
  } catch (err) {
    console.error('product-live error:', err);
    return Response.json({ error: 'API error' }, { status: 500 });
  }
}
```

---

## ZMIANA 6 — components/ProductDetail.tsx

Upewnij się że na stronie produktu live dane ładują się po renderze:

```typescript
// W ProductDetail — logika live ceny
const [liveData, setLiveData] = useState<LiveData | null>(null);
const [liveLoading, setLiveLoading] = useState(true);

useEffect(() => {
  fetch(`/api/product-live?id=${product.id}`)
    .then(r => r.json())
    .then(data => {
      setLiveData(data);
      setLiveLoading(false);
    })
    .catch(() => setLiveLoading(false));
}, [product.id]);
```

**UI dla live danych:**
- Podczas ładowania: skeleton loader na cenie i stanie
- Po załadowaniu: pokaż aktualną cenę z API (nie z Typesense)
- Jeśli API zwróci błąd: zostaw cenę z Typesense jako fallback z adnotacją "cena orientacyjna"

---

## ZMIANA 7 — components/OrderButton.tsx

Upewnij się że przy dodaniu do koszyka wywołujesz walidację:

```typescript
async function handleAddToCart() {
  setLoading(true);

  // 1. Waliduj przez Nextis API
  const validation = await fetch('/api/order-validate', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ code: product.product_code, brand: product.brand, qty }]
    })
  }).then(r => r.json());

  const item = validation.items?.[0];

  if (!item || item.status === 'cancelled') {
    setError('Produkt není dostupný');
    setLoading(false);
    return;
  }

  if (item.qtyToDelivery < qty) {
    // Pokaż warning: "Dostupné pouze X ks, zbytek na objednávku"
    setWarning(`Skladem pouze ${item.qtyToDelivery} ks, zbytek na objednávku`);
  }

  // 2. Dodaj do koszyka z aktualną ceną z live API
  addToCart({ ...product, qty, currentPrice: liveData?.price });
  setLoading(false);
}
```

---

## ZMIANA 8 — .env.local — nowe zmienne

Dodaj do `.env.local.example`:

```bash
# FTP (eksport z Nextis ERP)
FTP_HOST=ftp.mroauto.cz
FTP_USER=ftpuser
FTP_PASSWORD=ftppassword
FTP_PRODUCTS_PATH=/exports/produkty.csv
FTP_STOCKS_PATH=/exports/stany.csv

# Sync webhook secret
SYNC_SECRET=twoj_tajny_klucz_do_webhooka

# REST API Nextis (live ceny, zamówienia)
NEXTIS_API_URL=https://api.mroauto.nextis.cz
NEXTIS_API_LOGIN=login
NEXTIS_API_PASSWORD=haslo

# Typesense
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_ADMIN_KEY=...
TYPESENSE_SEARCH_KEY=...
NEXT_PUBLIC_TYPESENSE_HOST=xxx.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=...
```

---

## CZEGO NIE ZMIENIAJ

- `lib/typesense.ts` — schema i klient bez zmian
- `lib/nextis-api.ts` — klient REST API bez zmian
- `app/api/search/route.ts` — search proxy bez zmian
- `app/api/order-send/route.ts` — wysyłanie zamówień bez zmian
- Wszystkie komponenty UI poza ProductDetail i OrderButton
- Strony `/` i `/search`

---

## KOLEJNOŚĆ WYKONANIA

1. Zainstaluj nowe pakiety: `npm install basic-ftp csv-parse`
2. Utwórz `lib/ftp.ts`
3. Przepisz `lib/sync.ts`
4. Zaktualizuj `scripts/sync-products.ts`
5. Zaktualizuj `app/api/sync/route.ts`
6. Sprawdź/popraw `app/api/product-live/route.ts`
7. Sprawdź/popraw `components/ProductDetail.tsx` (live loading)
8. Sprawdź/popraw `components/OrderButton.tsx` (walidacja)
9. Zaktualizuj `.env.local.example`
10. Usuń `lib/db.ts`

---

## TEST PO ZMIANACH

```bash
# 1. Test czy FTP działa (wymaga uzupełnionych .env)
npx tsx -e "import {listFTPFiles} from './lib/ftp'; listFTPFiles('/').then(console.log)"

# 2. Test sync na małym pliku
npm run sync:test

# 3. Test live API (wymaga działającego Nextis API)
curl "localhost:3000/api/product-live?id=19380"

# 4. Test webhooka sync
curl -X POST localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"stocks","secret":"twoj_tajny_klucz"}'
```
