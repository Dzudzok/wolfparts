# AutoDíly — Claude Code Prompt + Dokumentacja API

---

## CZĘŚĆ 1: REST API Nextis (api.mroauto.nextis.cz)

> **Base URL:** `https://api.mroauto.nextis.cz`  
> **Wersja:** v10.53  
> **Format:** JSON, wszystkie requesty POST  
> **Autentykacja:** Token JWT uzyskany przez `/common/authentication`, przekazywany w polu `token` każdego requesta

---

### Autentykacja

#### `POST /common/authentication`
Uzyskaj token JWT do dalszych wywołań.

**Request:**
```json
{
  "login": "twój_login",
  "password": "twoje_hasło"
}
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "tokenValidTo": "2025-03-21T10:00:00"
}
```

> Token jest ważny przez określony czas. Po wygaśnięciu wywołaj ponownie `/common/authentication`.

---

### Katalog produktów

Wszystkie endpointy katalogowe zwracają obiekt `CatalogItem` z następującymi polami:

| Pole | Typ | Opis |
|------|-----|------|
| `ID` | int | Wewnętrzny ID produktu w Nextis |
| `ProductCode` | string | Kod produktu |
| `ProductName` | string | Nazwa produktu |
| `ProductDescription` | string | Opis |
| `ProductBrand` | string | Marka |
| `ProductPrefix` | string | Prefix kodu |
| `QtyAvailableMain` | double | Stan mag. główny |
| `QtyAvailableMainDetailed` | object | Stan per magazyn `{IDWarehouse, Qty, WarehouseName}` |
| `QtyAvailableOther` | array | Inne magazyny/oddziały |
| `QtyAvailableSupplier` | double | Dostępność u dostawcy |
| `QtyAvailableProduction` | double | Dostępność produkcyjna |
| `QtyMinimal` | double | Minimalna ilość zamówienia |
| `QtyMultiply` | double | Mnożnik ilości |
| `QtyPackage` | double | Ilość w opakowaniu |
| `Price.UnitPrice` | double | Cena netto |
| `Price.UnitPriceIncVAT` | double | Cena brutto |
| `Price.UnitPriceRetail` | double | Cena detaliczna netto |
| `Price.UnitPriceRetailIncVAT` | double | Cena detaliczna brutto |
| `Price.Discount` | double | Rabat % |
| `Price.VATRate` | double | Stawka VAT % |
| `Price.Currency` | enum | Waluta |
| `Price.Reliability` | enum | Wiarygodność ceny |
| `Price.Valid` | bool | Czy cena jest aktualna |
| `OECodes` | array | Numery OEM `[{Code, Manufacturer}]` |
| `BarCodes` | array | Kody EAN/kreskowe |
| `WeightKg` | double | Waga w kg |
| `Valid` | bool | Czy produkt aktywny |
| `ItemType` | enum | Typ produktu |

---

#### `POST /catalogs/items-checking`
Sprawdź produkty **po kodzie i marce** (najczęściej używany endpoint).  
Limit domyślny: 100 req/dzień, 100 produktów/request.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "getEANCodes": true,
  "getOECodes": true,
  "getServices": false,
  "getDeposits": false,
  "getCashBack": false,
  "searchTarget": 0,
  "trySearchWithoutManufacturer": false,
  "items": [
    {
      "code": "KG150014.7.1",
      "brand": "FTE",
      "prefix": "",
      "requestedQty": 1.0,
      "pairID": 0,
      "internalID": 0
    }
  ]
}
```

**`searchTarget` enum:**
- `0` = StandardItems (części standardowe)
- `1` = UniversalItems (części uniwersalne)
- `2` = Both

**Response 200:**
```json
{
  "successRatio": 1.0,
  "items": [
    {
      "requestItem": { "code": "KG150014.7.1", "brand": "FTE" },
      "responseItem": { /* CatalogItem */ }
    }
  ]
}
```

---

#### `POST /catalogs/items-checking-by-id`
Sprawdź produkty **po wewnętrznym ID Nextis**.  
Przydatne gdy masz już ProductID z bazy MSSQL.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "getEANCodes": true,
  "getOECodes": true,
  "items": [
    { "id": 96895 },
    { "id": 96896 }
  ]
}
```

---

#### `POST /catalogs/items-finding-by-code`
Znajdź produkty **po kodzie TecDoc**.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "code": "325909",
  "target": 0,
  "genArtID": 0,
  "brandIDs": [23]
}
```

**`target` enum (TecDocTargetType):**
- `0` = PassengerCars
- `1` = CommercialVehicles
- `2` = Bikes

---

#### `POST /catalogs/items-finding-by-vehicle`
Znajdź produkty **dla konkretnego pojazdu** (TecDoc K-type / EngineID).

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "engineID": 12345,
  "target": 0,
  "genArtID": 1234
}
```

> `engineID` = TecDoc K-type (ID silnika)  
> `genArtID` = ID kategorii części wg TecDoc (np. 1 = filtry oleju)

---

### Dokumenty

#### `POST /documents/invoices`
Pobierz faktury z zakresu dat.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-03-31",
  "loadAll": false
}
```

> `loadAll: true` — tylko dla konta HQ, zwraca faktury wszystkich oddziałów

**Response** zawiera listę faktur z polami: `ID`, `No`, `DateIssued`, `AmountNetto`, `AmountBrutto`, `Currency`, `Items[]`, `DeliveryAddress`, `TransportName`, `PaymentState`, `DateOfMaturity`

---

#### `POST /documents/deliverynotes`
Pobierz listy WZ (wydania magazynowe).

**Request:** identyczny jak `/documents/invoices`

---

#### `POST /documents/invoice-file`
Pobierz plik PDF faktury.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "documentNumber": "FV2025/001234"
}
```

**Response:**
```json
{
  "invoiceFile": "base64...",
  "invoiceFileName": "FV2025001234.pdf"
}
```

---

### Zamówienia

#### `POST /orders/validation`
Zwaliduj zamówienie **przed wysłaniem** (sprawdź dostępność, ceny).

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs",
  "items": [
    {
      "code": "KG150014.7.1",
      "brand": "FTE",
      "qty": 2.0,
      "userNote": "",
      "searchedFor": "KG150014.7.1"
    }
  ],
  "orderType": 0,
  "keepBackOrder": false,
  "trySearchWithoutManufacturer": false
}
```

**Response** — per item:
- `QtyToDelivery` — ile wyślą od razu
- `QtyBackOrder` — ile na backorder
- `QtyCancelled` — ile anulowane
- `Status` — enum statusu pozycji

---

#### `POST /orders/sending`
**Złóż zamówienie.**

**Request** (rozszerzony o dodatkowe pola vs validation):
```json
{
  "token": "eyJ...",
  "language": "cs",
  "items": [
    {
      "code": "KG150014.7.1",
      "brand": "FTE",
      "qty": 2.0,
      "info1": "",
      "info2": "",
      "info3": ""
    }
  ],
  "orderType": 0,
  "keepBackOrder": true,
  "separatedDocument": false,
  "waitNextOrder": false,
  "userNote": "Poznámka k objednávce",
  "userOrder": "MUJ-ORDER-001",
  "confirmOptionalPromotionItems": false,
  "optionalDeliveryAddress": {
    "street": "Ulice 123",
    "city": "Praha",
    "postalCode": "11000",
    "country": 0
  }
}
```

**`orderType` enum:**
- `0` = Standard
- `1` = Express
- `2` = Night

**Response** zawiera `orders[]` z `{ID, No, Note}` i `items[]` z `{QtyCommited, UnitPriceCommited, TotalPriceCommited, Status, Order}`

---

### Partner

#### `POST /partners/info`
Dane firmy + adresy dostaw.

**Request:**
```json
{
  "token": "eyJ...",
  "language": "cs"
}
```

**Response:**
```json
{
  "headquarter": {
    "companyName": "MROAUTO AUTODÍLY s.r.o.",
    "taxID": "CZ...",
    "vatID": "CZ..."
  },
  "subsidiaries": [
    {
      "id": 1,
      "addressName": "Hlavní sklad",
      "street": "...",
      "city": "...",
      "postalCode": "...",
      "country": 0,
      "email": "...",
      "phone": "...",
      "accessibleWarehouses": [{ "id": 1, "name": "Sklad A" }]
    }
  ]
}
```

---

#### `POST /partners/credit`
Stan kredytu kupieckiego.

**Response:**
```json
{
  "limit": 500000.0,
  "debts": 123456.0,
  "debtsOverdue": 0.0,
  "limitOverdue": 30000.0,
  "exceeded": false,
  "percentageDebts": 24,
  "percentageDebtsOverdue": 0,
  "countInvoiceOverdue": 0,
  "debstDeliveryNotes": 45000.0
}
```

---

### Typowy flow użycia REST API w eshopie

```
1. POST /common/authentication          → uzyskaj token (cache na czas ważności)
2. POST /catalogs/items-checking-by-id  → pobierz aktualne ceny/stany dla koszyka
3. POST /orders/validation              → sprawdź przed zamówieniem
4. POST /orders/sending                 → złóż zamówienie
5. POST /documents/invoices             → pobierz faktury dla klienta
6. POST /documents/invoice-file         → pobierz PDF faktury
```

---

---

## CZĘŚĆ 2: Baza danych MSSQL (Nextis Data API)

> Bezpośredni dostęp SQL — używany do bulk export produktów do Typesense.

### Kluczowe widoki

| Widok | Opis |
|-------|------|
| `API_GetProductGroups` | **Master tabela produktów** — nazwa, marka, kategoria, ceny. Uwaga: duplikaty per dostawca, wymagany GROUP BY po `ID` |
| `API_GetProducts` | Produkty per dostawca — `GroupID` łączy z `API_GetProductGroups.ID` |
| `API_GetStockDispositions` | Stany magazynowe — `ProductID` łączy z `API_GetProducts.ID` |
| `API_GetProductOEM` | Numery OEM — `GroupID` łączy z `API_GetProductGroups.ID` |
| `API_GetProductEAN` | Kody EAN — `GroupID` łączy z `API_GetProductGroups.ID` |
| `API_GetCrossNumbers` | Numery krzyżowe — `GroupID` łączy z `API_GetProductGroups.ID` |
| `API_GetImage` | Zdjęcia — `ProduktGroupID` łączy z `API_GetProductGroups.ID` |
| `API_GetOrders` | Zamówienia |
| `API_GetInvoices` | Faktury |
| `API_GetCustomers` | Klienci |

### Skala danych
- Łączna liczba wierszy w `API_GetProductGroups`: ~12.6M
- Unikalne produkty (po deduplikacji): **~4.9M**
- Produkty ze zdjęciami: ~24,660

### Główne zapytanie eksportowe (przetestowane, ~1s na 20 wierszy)

```sql
WITH ProductsDeduped AS (
    SELECT 
        g.ID                    AS ProductID,
        g.ProductCode,
        g.Name,
        g.Description,
        g.EshopDescription,
        g.TecDocBrandName       AS Brand,
        g.GroupName             AS BrandGroup,
        g.SubGoupName           AS Category,
        g.AssortmentName,
        MIN(g.RetailPrice)      AS RetailPriceMin,
        MAX(g.RetailPrice)      AS RetailPriceMax,
        MIN(g.PurchasePrice)    AS PurchasePrice,
        g.VATRate,
        g.IsArchiving,
        g.IsSale,
        g.IsHiddenOnEshop
    FROM API_GetProductGroups g
    WHERE g.IsArchiving = 0
      AND g.IsHiddenOnEshop = 0
    GROUP BY
        g.ID, g.ProductCode, g.Name, g.Description, g.EshopDescription,
        g.TecDocBrandName, g.GroupName, g.SubGoupName, g.AssortmentName,
        g.VATRate, g.IsArchiving, g.IsSale, g.IsHiddenOnEshop
)
SELECT 
    p.ProductID,
    p.ProductCode,
    p.Name,
    p.Description,
    p.EshopDescription,
    p.Brand,
    p.BrandGroup,
    p.Category,
    p.AssortmentName,
    p.RetailPriceMin,
    p.RetailPriceMax,
    p.PurchasePrice,
    p.VATRate,
    p.IsSale,
    p.IsHiddenOnEshop,

    -- Zdjęcie (pierwsze dostępne)
    (SELECT TOP 1 ImageURL 
     FROM API_GetImage i 
     WHERE i.ProduktGroupID = p.ProductID 
     ORDER BY i.Sorting)                        AS ImageURL,

    -- Stan magazynowy (suma przez wszystkich dostawców)
    ISNULL((
        SELECT SUM(sd.OnStockQuantity)
        FROM API_GetProducts pr
        JOIN API_GetStockDispositions sd ON sd.ProductID = pr.ID
        WHERE pr.GroupID = p.ProductID AND pr.IsArchiving = 0
    ), 0)                                       AS TotalStock,

    -- OEM numery (pipe-separated)
    ISNULL((
        SELECT DISTINCT oem.OEM + '|'
        FROM API_GetProductOEM oem
        WHERE oem.GroupID = p.ProductID
        FOR XML PATH('')
    ), '')                                      AS OEMNumbers,

    -- EAN kody (pipe-separated)
    ISNULL((
        SELECT ean.EAN + '|'
        FROM API_GetProductEAN ean
        WHERE ean.GroupID = p.ProductID AND ean.IsArchiving = 0
        FOR XML PATH('')
    ), '')                                      AS EANCodes,

    -- Cross numery (pipe-separated, format "Brand:Code")
    ISNULL((
        SELECT DISTINCT cn.BrandName + ':' + cn.Code + '|'
        FROM API_GetCrossNumbers cn
        WHERE cn.GroupID = p.ProductID
        FOR XML PATH('')
    ), '')                                      AS CrossNumbers

FROM ProductsDeduped p
ORDER BY p.ProductID
OFFSET @offset ROWS FETCH NEXT @batchSize ROWS ONLY
```

> **Uwaga:** Ceny używają przecinka jako separatora dziesiętnego (np. `"655,168500"`) — przy parsowaniu zastąp `,` → `.`

---

---

## CZĘŚĆ 3: Claude Code Prompt — Budowa Eshopu

```
Zbuduj aplikację e-commerce "AutoDíly" — katalog części samochodowych
z full-text search i możliwością składania zamówień przez API Nextis.

## STACK
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Typesense (search engine — self-hosted na Render.com lub Typesense Cloud)
- mssql npm package (połączenie do bazy Nextis MSSQL — bulk sync)
- node-fetch / axios (połączenie do REST API Nextis — zamówienia, live ceny)
- Render.com (deployment)

## STRUKTURA PROJEKTU

autodily/
├── app/
│   ├── page.tsx                        # strona główna z searchboxem
│   ├── search/page.tsx                 # wyniki wyszukiwania
│   ├── product/[id]/page.tsx           # detail produktu + live cena z API
│   └── api/
│       ├── search/route.ts             # proxy do Typesense (ukrywa klucz)
│       ├── product-live/route.ts       # live cena/stan z Nextis REST API
│       ├── order-validate/route.ts     # walidacja zamówienia
│       ├── order-send/route.ts         # złożenie zamówienia
│       └── sync/route.ts              # webhook triggerujący sync
├── lib/
│   ├── typesense.ts                    # klient Typesense + schema
│   ├── db.ts                           # klient MSSQL (Nextis)
│   ├── nextis-api.ts                   # klient REST API Nextis
│   └── sync.ts                         # logika sync MSSQL → Typesense
├── scripts/
│   └── sync-products.ts               # sync script (cron)
└── components/
    ├── SearchBox.tsx
    ├── ProductCard.tsx
    ├── ProductGrid.tsx
    ├── Filters.tsx
    ├── Pagination.tsx
    ├── ProductDetail.tsx
    └── OrderButton.tsx

## BAZA DANYCH MSSQL

Connection string z env: NEXTIS_DB_CONNECTION

Format: "Server=HOST;Database=DB;User Id=USER;Password=PASS;Encrypt=false"

Użyj pakietu `mssql`. Główne zapytanie eksportowe z OFFSET/FETCH dla paginacji:

[WKLEJ TUTAJ ZAPYTANIE SQL Z CZĘŚCI 2 TEGO DOKUMENTU]

Parametry: @offset (int), @batchSize (int, użyj 5000)

## REST API NEXTIS

Base URL: https://api.mroauto.nextis.cz
Wszystkie requesty: POST, Content-Type: application/json

### lib/nextis-api.ts — wymagane funkcje:

1. `authenticate()` → POST /common/authentication
   - Używa NEXTIS_API_LOGIN i NEXTIS_API_PASSWORD z env
   - Cache token w pamięci (sprawdzaj TokenValidTo przed każdym wywołaniem)
   - Zwraca: { token: string, tokenValidTo: Date }

2. `checkItemsByID(ids: number[])` → POST /catalogs/items-checking-by-id
   - Pobiera live ceny i stany dla podanych ProductID
   - Parametry: getEANCodes: true, getOECodes: true, language: "cs"
   - Zwraca: CatalogItem[] z cenami, stanami, OEM kodami

3. `validateOrder(items: OrderItem[])` → POST /orders/validation
   - Sprawdza dostępność przed zamówieniem
   - Zwraca per-item: QtyToDelivery, QtyBackOrder, Status

4. `sendOrder(items: OrderItem[], userOrder?: string)` → POST /orders/sending
   - Składa zamówienie
   - keepBackOrder: true
   - Zwraca: orders[] z numerami zamówień

5. `getPartnerInfo()` → POST /partners/info
   - Dane firmy i adresy dostaw

## TYPESENSE SCHEMA

```typescript
const productsSchema = {
  name: 'products',
  fields: [
    { name: 'id',             type: 'string' },
    { name: 'product_code',   type: 'string',   facet: true },
    { name: 'name',           type: 'string' },
    { name: 'description',    type: 'string',   optional: true },
    { name: 'brand',          type: 'string',   facet: true },
    { name: 'brand_group',    type: 'string',   facet: true },
    { name: 'category',       type: 'string',   facet: true },
    { name: 'assortment',     type: 'string',   facet: true, optional: true },
    { name: 'price_min',      type: 'float' },
    { name: 'price_max',      type: 'float' },
    { name: 'purchase_price', type: 'float' },
    { name: 'in_stock',       type: 'bool',     facet: true },
    { name: 'stock_qty',      type: 'float' },
    { name: 'is_sale',        type: 'bool',     facet: true },
    { name: 'image_url',      type: 'string',   optional: true, index: false },
    { name: 'oem_numbers',    type: 'string[]', optional: true },
    { name: 'ean_codes',      type: 'string[]', optional: true },
    { name: 'cross_numbers',  type: 'string[]', optional: true },
    { name: 'updated_at',     type: 'int64' },
  ],
  default_sorting_field: 'stock_qty'
}
```

## SYNC LOGIC (lib/sync.ts)

Funkcja `syncProducts(limit?: number)`:
1. Połącz do MSSQL
2. Pobierz COUNT produktów
3. Iteruj partiami po 5000 (OFFSET 0, 5000, 10000...)
4. Transformuj każdy wiersz:
   - id = String(ProductID)
   - oem_numbers = OEMNumbers.split('|').filter(Boolean)
   - ean_codes = EANCodes.split('|').filter(Boolean)  
   - cross_numbers = CrossNumbers.split('|').filter(Boolean)
   - in_stock = Number(TotalStock) > 0
   - stock_qty = parseFloat(String(TotalStock))
   - price_min = parseFloat(String(RetailPriceMin).replace(',', '.'))
   - price_max = parseFloat(String(RetailPriceMax).replace(',', '.'))
   - purchase_price = parseFloat(String(PurchasePrice).replace(',', '.'))
   - is_sale = IsSale === '1' || IsSale === true
   - updated_at = Date.now()
5. Upsert do Typesense: action 'upsert', batch 5000
6. Loguj: "Batch X/Y — offset: N — czas: Xs"
7. Jeśli batch się nie uda: loguj błąd, kontynuuj następny
8. Na końcu: łączny czas, liczba produktów

## SEARCH ENDPOINT (app/api/search/route.ts)

POST, przyjmuje:
```typescript
{
  q: string,
  brand?: string,
  category?: string,
  assortment?: string,
  in_stock?: boolean,
  is_sale?: boolean,
  price_min?: number,
  price_max?: number,
  page?: number,        // default 1
  per_page?: number     // default 24
}
```

Konfiguracja Typesense:
- query_by: 'name,product_code,ean_codes,oem_numbers,cross_numbers,brand,description'
- query_by_weights: '5,4,4,3,2,2,1'
- facet_by: 'brand,category,assortment,in_stock,is_sale'
- num_typos: 1
- typo_tokens_threshold: 2
- highlight_full_fields: 'name,product_code'

## LIVE CENA (app/api/product-live/route.ts)

GET ?id=12345
- Wywołuje nextis-api.ts → checkItemsByID([id])
- Zwraca: { price, priceIncVAT, priceRetail, qty, valid }
- Cache 5 minut (headers Cache-Control)

## UI KOMPONENTY

### SearchBox
- Duży input z ikoną lupy, autofocus
- Placeholder: "Hledat díly... název, kód OEM, EAN"  
- Debounce 300ms na live search
- Enter → redirect /search?q=...

### ProductCard
- Zdjęcie (fallback: szary placeholder z ikoną klucza)
- Badge marki (kolorowy)
- Nazwa produktu (max 2 linie, truncate)
- Kategoria (szary tekst)
- Cena: "od X Kč" (jeśli min != max) lub "X Kč"
- Status: zielony "Skladem (N ks)" / szary "Na objednávku"
- Przycisk "Detail →"

### Filters (sidebar lewy)
- Sekcja "Značka" — facet z licznikiem, max 20, searchable input
- Sekcja "Kategorie" — facet z licznikiem, max 15
- Sekcja "Sortiment" — facet z licznikiem, max 10
- Checkbox "Pouze skladem"
- Checkbox "Akce / výprodej"
- Przycisk "Zrušit filtry" (widoczny gdy aktywne filtry)
- Na mobile: drawer z przyciskiem "Filtrovat"

### Strona /search
- Header: 'Výsledky pro "query"' + "Nalezeno X dílů"
- Sidebar z Filters (desktop) / drawer (mobile)
- Sortowanie: relevance / cena asc / cena desc / skladem první
- Grid: 4 kolumny desktop, 2 tablet, 1 mobile
- Paginacja numeryczna, max 20 stron

### Strona /product/[id]
- Breadcrumb: Katalog > Kategoria > Nazwa
- Zdjęcie duże (z galerią jeśli więcej)
- Nazwa, marka, kod produktu
- Live cena (pobierana client-side z /api/product-live)
- Stan: "Skladem X ks" / "Na objednávku"
- Tabela: OEM numery, EAN, Cross numbers, Marka, Kategoria
- Przycisk "Přidat do košíku" → walidacja → zamówienie
- Skeleton loading dla live danych

## ŚRODOWISKO (.env.local)

```
# MSSQL (Nextis Data API — bulk sync)
NEXTIS_DB_CONNECTION=Server=HOST;Database=DB;User Id=USER;Password=PASS;Encrypt=false

# REST API Nextis (zamówienia, live ceny)
NEXTIS_API_URL=https://api.mroauto.nextis.cz
NEXTIS_API_LOGIN=twoj_login
NEXTIS_API_PASSWORD=twoje_haslo

# Typesense
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_ADMIN_KEY=...
TYPESENSE_SEARCH_KEY=...
NEXT_PUBLIC_TYPESENSE_HOST=xxx.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=...
```

## PACKAGE.JSON SCRIPTS

```json
{
  "sync:full": "tsx scripts/sync-products.ts",
  "sync:test": "tsx scripts/sync-products.ts --limit 1000",
  "sync:dry": "tsx scripts/sync-products.ts --limit 100 --dry-run"
}
```

## WAŻNE SZCZEGÓŁY TECHNICZNE

1. **Ceny z MSSQL** używają przecinka jako separatora dziesiętnego (`"655,168500"`)
   → zawsze parsuj przez `.replace(',', '.')`

2. **VATRate** w MSSQL to wewnętrzne ID stawki (np. `16028`), nie procent
   → nie pokazuj w UI, używaj cen z API które zawierają już VAT

3. **IsSale** może być pusty string, "0" lub "1"
   → `IsSale === '1'` jako warunek

4. **TotalStock** to DECIMAL z MSSQL → zawsze `parseFloat()`

5. **Token Nextis REST API** — cache w module-level zmiennej, sprawdzaj
   `tokenValidTo` przed każdym wywołaniem, odnawiaj automatycznie

6. **Typesense** — search-only klucz (NEXT_PUBLIC_) używaj tylko w
   prostym fetch, admin klucz tylko server-side

7. **Produkty bez zdjęć** — ImageURL będzie null/empty, pokaż placeholder

8. **Cross numbers** format w bazie: `"ACI:632006|BOSCH:1234567|"`
   → split('|').filter(Boolean) → ['ACI:632006', 'BOSCH:1234567']

## KOLEJNOŚĆ BUDOWANIA

1. `lib/typesense.ts` — schema, klient, funkcja createCollection
2. `lib/db.ts` — pool MSSQL, funkcja query z parametrami  
3. `lib/sync.ts` — pełna logika sync z logowaniem
4. `scripts/sync-products.ts` — executable z --limit i --dry-run flags
5. `lib/nextis-api.ts` — klient REST API z cache tokenu
6. `app/api/search/route.ts` — search proxy
7. `app/api/product-live/route.ts` — live cena
8. `app/api/order-validate/route.ts` — walidacja
9. `app/api/order-send/route.ts` — zamówienie
10. `components/` — wszystkie komponenty
11. `app/page.tsx` — strona główna
12. `app/search/page.tsx` — wyniki
13. `app/product/[id]/page.tsx` — detail

## PIERWSZY TEST PO ZBUDOWANIU

```bash
# 1. Test sync na 1000 produktach
npm run sync:test

# 2. Sprawdź w Typesense dashboard ile produktów weszło
# 3. Przetestuj search: curl localhost:3000/api/search -d '{"q":"FTE"}'
# 4. Otwórz przeglądarkę localhost:3000
```
```

---

*Dokument wygenerowany: 2026-03-20*  
*Źródło API: https://api.mroauto.nextis.cz (swagger v10.53)*  
*Baza danych: Nextis MSSQL — zbadane widoki i przetestowane zapytania*
