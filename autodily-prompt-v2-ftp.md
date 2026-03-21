# AutoDíly — Claude Code Prompt (wersja z FTP + Typesense)

Zbuduj aplikację e-commerce "AutoDíly" — katalog części samochodowych
z full-text search. Dane produktów pochodzą z plików CSV na FTP.
Aktualne ceny i stany pobierane on-demand przez REST API Nextis.

---

## STACK
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Typesense (search engine)
- basic-ftp (pobieranie CSV z FTP)
- csv-parse (parsowanie CSV)
- axios (REST API Nextis)
- Render.com (deployment)

---

## STRUKTURA PROJEKTU

```
autodily/
├── app/
│   ├── page.tsx                     # strona główna z searchboxem
│   ├── search/page.tsx              # wyniki wyszukiwania
│   ├── product/[id]/page.tsx        # detail produktu
│   └── api/
│       ├── search/route.ts          # proxy do Typesense
│       ├── product-live/route.ts    # live cena/stan z Nextis REST API
│       ├── order-validate/route.ts  # walidacja zamówienia
│       ├── order-send/route.ts      # złożenie zamówienia
│       └── sync/route.ts           # webhook triggerujący sync
├── lib/
│   ├── typesense.ts                 # klient Typesense + schema
│   ├── ftp.ts                       # klient FTP
│   ├── nextis-api.ts                # klient REST API Nextis
│   └── sync.ts                      # logika sync FTP CSV → Typesense
├── scripts/
│   └── sync-products.ts             # sync script
└── components/
    ├── SearchBox.tsx
    ├── ProductCard.tsx
    ├── ProductGrid.tsx
    ├── Filters.tsx
    ├── Pagination.tsx
    ├── ProductDetail.tsx
    └── OrderButton.tsx
```

---

## FORMAT CSV (separator `;`, wartości w cudzysłowach, BOM UTF-8)

```
"ProductID";"ProductCode";"Name";"Description";"EshopDescription";
"Brand";"BrandGroup";"Category";"AssortmentName";
"RetailPriceMin";"RetailPriceMax";"PurchasePrice";"IsSale";
"ImageURL";"TotalStock";"OEMNumbers";"EANCodes";"CrossNumbers"
```

**Uwagi:**
- Ceny używają przecinka jako separatora dziesiętnego: `"655,168500"`
- OEMNumbers, EANCodes, CrossNumbers: pipe-separated: `"FTE:KG150|BOSCH:123|"`
- CrossNumbers format: `"Brand:Code|Brand2:Code2|"`
- ImageURL może być pusty string
- TotalStock to liczba zmiennoprzecinkowa

---

## lib/ftp.ts

```typescript
import * as ftp from 'basic-ftp';
import { Writable } from 'stream';

const FTP_CONFIG = {
  host:     process.env.FTP_HOST!,
  user:     process.env.FTP_USER!,
  password: process.env.FTP_PASSWORD!,
  secure:   false,
};

export async function fetchFileFromFTP(remotePath: string): Promise<string> {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access(FTP_CONFIG);
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk, _, cb) { chunks.push(Buffer.from(chunk)); cb(); }
    });
    await client.downloadTo(writable, remotePath);
    return Buffer.concat(chunks).toString('utf-8');
  } finally {
    client.close();
  }
}

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

---

## lib/typesense.ts

```typescript
import Typesense from 'typesense';

export const productsSchema = {
  name: 'products',
  fields: [
    { name: 'id',             type: 'string' as const },
    { name: 'product_code',   type: 'string' as const, facet: true },
    { name: 'name',           type: 'string' as const },
    { name: 'description',    type: 'string' as const, optional: true },
    { name: 'brand',          type: 'string' as const, facet: true },
    { name: 'brand_group',    type: 'string' as const, facet: true },
    { name: 'category',       type: 'string' as const, facet: true },
    { name: 'assortment',     type: 'string' as const, facet: true, optional: true },
    { name: 'price_min',      type: 'float'  as const },
    { name: 'price_max',      type: 'float'  as const },
    { name: 'in_stock',       type: 'bool'   as const, facet: true },
    { name: 'stock_qty',      type: 'float'  as const },
    { name: 'is_sale',        type: 'bool'   as const, facet: true },
    { name: 'image_url',      type: 'string' as const, optional: true, index: false },
    { name: 'oem_numbers',    type: 'string[]' as const, optional: true },
    { name: 'ean_codes',      type: 'string[]' as const, optional: true },
    { name: 'cross_numbers',  type: 'string[]' as const, optional: true },
    { name: 'updated_at',     type: 'int64'  as const },
  ],
  default_sorting_field: 'stock_qty',
};

export function getTypesenseAdminClient() {
  return new Typesense.Client({
    nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: 'https' }],
    apiKey: process.env.TYPESENSE_ADMIN_KEY!,
    connectionTimeoutSeconds: 30,
  });
}

export function getTypesenseSearchClient() {
  return new Typesense.Client({
    nodes: [{ host: process.env.TYPESENSE_HOST!, port: 443, protocol: 'https' }],
    apiKey: process.env.TYPESENSE_SEARCH_KEY!,
    connectionTimeoutSeconds: 10,
  });
}

export async function createCollectionIfNotExists() {
  const client = getTypesenseAdminClient();
  try {
    await client.collections('products').retrieve();
    console.log('✅ Kolekcja products już istnieje');
  } catch {
    await client.collections().create(productsSchema);
    console.log('✅ Kolekcja products utworzona');
  }
}
```

---

## lib/sync.ts

```typescript
import { fetchFileFromFTP } from './ftp';
import { parse } from 'csv-parse/sync';
import { getTypesenseAdminClient, createCollectionIfNotExists } from './typesense';

const FTP_PRODUCTS_PATH = process.env.FTP_PRODUCTS_PATH || '/exports/produkty.csv';

function parsePrice(val: string | number): number {
  if (!val && val !== 0) return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
}

function parsePipeList(val: string): string[] {
  if (!val || val === '') return [];
  return val.split('|').map(s => s.trim()).filter(Boolean);
}

export async function syncProductsFromCSV(limit?: number): Promise<void> {
  const startTime = Date.now();
  console.log('📥 Pobieranie CSV z FTP...');

  await createCollectionIfNotExists();

  const csvContent = await fetchFileFromFTP(FTP_PRODUCTS_PATH);

  const records = parse(csvContent, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  const items = limit ? records.slice(0, limit) : records;
  console.log(`📦 Przetwarzanie ${items.length} produktów...`);

  const client = getTypesenseAdminClient();
  const BATCH = 1000;
  let synced = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    const docs = batch
      .filter((r: any) => r.ProductID && r.ProductID !== '')
      .map((r: any) => ({
        id:           String(r.ProductID),
        product_code: r.ProductCode || '',
        name:         r.Name || '',
        description:  r.Description || '',
        brand:        r.Brand || 'Neznámá',
        brand_group:  r.BrandGroup || '',
        category:     r.Category || 'Nezařazeno',
        assortment:   r.AssortmentName || '',
        price_min:    parsePrice(r.RetailPriceMin),
        price_max:    parsePrice(r.RetailPriceMax),
        in_stock:     parsePrice(r.TotalStock) > 0,
        stock_qty:    parsePrice(r.TotalStock),
        is_sale:      r.IsSale === '1',
        image_url:    r.ImageURL || '',
        oem_numbers:  parsePipeList(r.OEMNumbers),
        ean_codes:    parsePipeList(r.EANCodes),
        cross_numbers: parsePipeList(r.CrossNumbers),
        updated_at:   Date.now(),
      }));

    try {
      const result = await client
        .collections('products')
        .documents()
        .import(docs, { action: 'upsert' });

      const failed = result.filter((r: any) => !r.success).length;
      errors += failed;
      synced += docs.length - failed;
    } catch (err) {
      console.error(`❌ Batch ${Math.floor(i/BATCH)+1} error:`, err);
      errors += docs.length;
    }

    const batchNum = Math.floor(i/BATCH)+1;
    const totalBatches = Math.ceil(items.length/BATCH);
    const elapsed = ((Date.now()-startTime)/1000).toFixed(1);
    console.log(`✅ Batch ${batchNum}/${totalBatches} — ${synced} OK, ${errors} błędów — ${elapsed}s`);
  }

  const totalTime = ((Date.now()-startTime)/1000).toFixed(1);
  console.log(`\n🏁 Sync zakończony — ${synced} produktów w ${totalTime}s (${errors} błędów)`);
}
```

---

## scripts/sync-products.ts

```typescript
import { syncProductsFromCSV } from '../lib/sync';

const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 Dry run — tylko sprawdzanie połączenia z FTP');
  import('../lib/ftp').then(({ listFTPFiles }) => {
    listFTPFiles('/').then(files => {
      console.log('Pliki na FTP:', files);
    });
  });
} else {
  syncProductsFromCSV(limit).catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
}
```

---

## lib/nextis-api.ts

```typescript
import axios from 'axios';

const BASE_URL = process.env.NEXTIS_API_URL || 'https://api.mroauto.nextis.cz';

// Cache tokenu
let cachedToken: string | null = null;
let tokenValidTo: Date | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && tokenValidTo && new Date() < tokenValidTo) {
    return cachedToken;
  }

  const res = await axios.post(`${BASE_URL}/common/authentication`, {
    login:    process.env.NEXTIS_API_LOGIN,
    password: process.env.NEXTIS_API_PASSWORD,
  });

  cachedToken = res.data.token;
  tokenValidTo = new Date(res.data.tokenValidTo);
  return cachedToken!;
}

function baseRequest() {
  return { language: 'cs' };
}

// Sprawdź produkty po ID — live ceny i stany
export async function checkItemsByID(ids: number[]) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/catalogs/items-checking-by-id`, {
    ...baseRequest(),
    token,
    getEANCodes: true,
    getOECodes:  true,
    items: ids.map(id => ({ id })),
  });
  return res.data.items || [];
}

// Walidacja zamówienia
export async function validateOrder(items: OrderItem[]) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/orders/validation`, {
    ...baseRequest(),
    token,
    keepBackOrder: true,
    items,
  });
  return res.data.items || [];
}

// Złożenie zamówienia
export async function sendOrder(items: OrderItem[], userOrder?: string) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/orders/sending`, {
    ...baseRequest(),
    token,
    keepBackOrder: true,
    userOrder: userOrder || '',
    items,
  });
  return res.data;
}

// Dane partnera
export async function getPartnerInfo() {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}/partners/info`, {
    ...baseRequest(),
    token,
  });
  return res.data;
}

interface OrderItem {
  code:  string;
  brand: string;
  qty:   number;
}
```

---

## app/api/search/route.ts

```typescript
import { getTypesenseSearchClient } from '@/lib/typesense';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    q = '*',
    brand,
    category,
    assortment,
    in_stock,
    is_sale,
    page = 1,
    per_page = 24,
    sort = 'relevance',
  } = body;

  // Buduj filtry
  const filters: string[] = [];
  if (brand)     filters.push(`brand:=${brand}`);
  if (category)  filters.push(`category:=${category}`);
  if (assortment) filters.push(`assortment:=${assortment}`);
  if (in_stock)  filters.push(`in_stock:=true`);
  if (is_sale)   filters.push(`is_sale:=true`);

  // Sortowanie
  const sortMap: Record<string, string> = {
    relevance:  '_text_match:desc,stock_qty:desc',
    price_asc:  'price_min:asc',
    price_desc: 'price_min:desc',
    stock:      'stock_qty:desc',
  };

  const client = getTypesenseSearchClient();

  const result = await client.collections('products').documents().search({
    q,
    query_by:            'name,product_code,ean_codes,oem_numbers,cross_numbers,brand,description',
    query_by_weights:    '5,4,4,3,2,2,1',
    facet_by:            'brand,category,assortment,in_stock,is_sale',
    max_facet_values:    30,
    filter_by:           filters.join(' && ') || undefined,
    sort_by:             sortMap[sort] || sortMap.relevance,
    page,
    per_page,
    num_typos:           1,
    typo_tokens_threshold: 2,
    highlight_full_fields: 'name,product_code',
    snippet_threshold:   30,
  });

  return Response.json(result);
}
```

---

## app/api/product-live/route.ts

```typescript
import { checkItemsByID } from '@/lib/nextis-api';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  try {
    const items = await checkItemsByID([parseInt(id)]);
    const item = items[0]?.responseItem;

    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

    return Response.json({
      price:       item.Price?.UnitPrice ?? 0,
      priceVAT:    item.Price?.UnitPriceIncVAT ?? 0,
      priceRetail: item.Price?.UnitPriceRetail ?? 0,
      discount:    item.Price?.Discount ?? 0,
      currency:    'CZK',
      qty:         item.QtyAvailableMain ?? 0,
      inStock:     (item.QtyAvailableMain ?? 0) > 0,
      valid:       item.Price?.Valid ?? false,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    });
  } catch (err) {
    console.error('product-live error:', err);
    return Response.json({ error: 'API unavailable' }, { status: 503 });
  }
}
```

---

## app/api/sync/route.ts

```typescript
import { syncProductsFromCSV } from '@/lib/sync';

export async function POST(req: Request) {
  const { secret } = await req.json();

  if (secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Odpal async — nie czekaj na zakończenie
  syncProductsFromCSV().catch(console.error);

  return Response.json({ status: 'sync started' });
}
```

---

## components/ProductCard.tsx

```tsx
interface ProductCardProps {
  hit: {
    id: string;
    product_code: string;
    name: string;
    brand: string;
    category: string;
    price_min: number;
    price_max: number;
    in_stock: boolean;
    stock_qty: number;
    image_url?: string;
    is_sale?: boolean;
  };
}

export function ProductCard({ hit }: ProductCardProps) {
  const hasImage = hit.image_url && hit.image_url !== '';

  return (
    <a href={`/product/${hit.id}`} className="block group">
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
        {/* Zdjęcie */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <img
              src={hit.image_url}
              alt={hit.name}
              className="object-contain w-full h-full p-2 group-hover:scale-105 transition-transform"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-part.svg';
              }}
            />
          ) : (
            <div className="text-gray-300 text-6xl">⚙️</div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Badges */}
          <div className="flex gap-1 mb-1 flex-wrap">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              {hit.brand}
            </span>
            {hit.is_sale && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                Akce
              </span>
            )}
          </div>

          {/* Název */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem]">
            {hit.name}
          </h3>

          {/* Kód */}
          <p className="text-xs text-gray-400 mb-2">{hit.product_code}</p>

          {/* Cena */}
          <p className="text-base font-bold text-gray-900">
            {hit.price_min > 0 ? (
              <>
                {hit.price_min !== hit.price_max ? 'od ' : ''}
                {hit.price_min.toFixed(0)} Kč
              </>
            ) : (
              <span className="text-gray-400 text-sm">Cena na dotaz</span>
            )}
          </p>

          {/* Sklad */}
          <p className={`text-xs mt-1 font-medium ${hit.in_stock ? 'text-green-600' : 'text-gray-400'}`}>
            {hit.in_stock
              ? `✓ Skladem (${hit.stock_qty.toFixed(0)} ks)`
              : '○ Na objednávku'}
          </p>
        </div>
      </div>
    </a>
  );
}
```

---

## components/ProductDetail.tsx — live cena

```tsx
'use client';
import { useState, useEffect } from 'react';

export function LivePrice({ productId, fallbackPrice }: {
  productId: string;
  fallbackPrice: number;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/product-live?id=${productId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />;
  }

  const price = data?.priceRetail || data?.price || fallbackPrice;
  const inStock = data?.inStock ?? false;
  const qty = data?.qty ?? 0;

  return (
    <div>
      <p className="text-3xl font-bold text-gray-900">
        {price > 0 ? `${price.toFixed(2)} Kč` : 'Cena na dotaz'}
      </p>
      {data?.discount > 0 && (
        <p className="text-sm text-green-600">Sleva {data.discount}%</p>
      )}
      <p className={`text-sm mt-1 font-medium ${inStock ? 'text-green-600' : 'text-orange-500'}`}>
        {inStock ? `✓ Skladem — ${qty.toFixed(0)} ks` : '○ Na objednávku'}
      </p>
      {!data && (
        <p className="text-xs text-gray-400 mt-1">* orientační cena</p>
      )}
    </div>
  );
}
```

---

## .env.local

```bash
# FTP (eksport CSV z Nextis ERP)
FTP_HOST=ftp.mroauto.cz
FTP_USER=ftpuser
FTP_PASSWORD=ftppassword
FTP_PRODUCTS_PATH=/exports/produkty.csv

# Nextis REST API (live ceny, zamówienia)
NEXTIS_API_URL=https://api.mroauto.nextis.cz
NEXTIS_API_LOGIN=login
NEXTIS_API_PASSWORD=haslo

# Typesense
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_ADMIN_KEY=twoj-admin-klucz
TYPESENSE_SEARCH_KEY=twoj-search-klucz
NEXT_PUBLIC_TYPESENSE_HOST=xxx.a1.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=twoj-search-klucz

# Sync webhook
SYNC_SECRET=losowy-tajny-string
```

---

## package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "sync:full":  "tsx scripts/sync-products.ts",
    "sync:test":  "tsx scripts/sync-products.ts --limit 500",
    "sync:dry":   "tsx scripts/sync-products.ts --dry-run"
  }
}
```

---

## KOLEJNOŚĆ WYKONANIA

1. `npm install basic-ftp csv-parse typesense axios`
2. Utwórz `lib/ftp.ts`
3. Utwórz `lib/typesense.ts`
4. Utwórz `lib/sync.ts`
5. Utwórz `scripts/sync-products.ts`
6. Utwórz `lib/nextis-api.ts`
7. Utwórz API routes
8. Utwórz komponenty i strony
9. Utwórz `.env.local` z prawdziwymi danymi

---

## TESTY PO ZBUDOWANIU

```bash
# 1. Sprawdź FTP
npm run sync:dry

# 2. Test sync 500 produktów
npm run sync:test

# 3. Sprawdź ile jest w Typesense
# (wejdź w Typesense Cloud dashboard lub wywołaj API)

# 4. Test search
curl -X POST localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"q":"FTE"}'

# 5. Test live ceny (użyj ID z CSV)
curl "localhost:3000/api/product-live?id=96895"

# 6. Otwórz localhost:3000
```

---

## ARCHITEKTURA DANYCH — podsumowanie

```
Nextis ERP SQL zadanie (raz dziennie 02:00)
  → eksportuje CSV na FTP
  → plik: /exports/produkty.csv

Next.js sync script (cron lub webhook)
  → pobiera CSV z FTP
  → parsuje, transformuje
  → upsert do Typesense

Użytkownik wyszukuje
  → Typesense (< 50ms, dane sprzed max 24h)
  → wyniki z nazwami, cenami orientacyjnymi, stanami

Użytkownik otwiera produkt
  → dane statyczne z Typesense (natychmiastowo)
  → live cena/stan z Nextis REST API (po ~500ms)

Użytkownik składa zamówienie
  → walidacja przez Nextis REST API
  → zamówienie przez Nextis REST API
```
