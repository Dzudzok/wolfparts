# WolfParts (Autodily) — Stan projektu na 26.03.2026 (aktualizacja wieczorna)

---

## 1. Co to jest

Full-stack **Next.js 16.2** e-commerce platforma na autodíly (části samochodowe), UI w języku czeskim.
Firma: **MROAUTO AUTODÍLY s.r.o.**, Bohumín, CZ (IČO: 06630405)
API Server: `https://api.mroauto.nextis.cz`

---

## 2. Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 16.2.0 (App Router) |
| UI | React 19.2.4 + TypeScript 5 |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Wyszukiwarka | Typesense Cloud (6M+ produktów) |
| ERP | Nextis API (ceny, stany, zamówienia) |
| Katalog pojazdów | TecAlliance TecDoc Pegasus 3.0 API |
| Scraping | Cheerio (HTML parsing) |
| FTP | basic-ftp (sync CSV produktów) |
| Baza SQL | MSSQL (sqlhost7.48.nextis.cz) |
| HTTP | axios |
| Font | Source Sans 3 (400, 600, 700) |

---

## 3. Trzy źródła danych

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   TecDoc API    │     │   Nextis ERP    │     │   Typesense     │
│   (Pegasus 3.0) │     │   (REST API)    │     │   (Cloud)       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Pojazdy         │     │ Ceny na żywo    │     │ Full-text search│
│ Producenci      │     │ Stany magazyn.  │     │ 6M+ produktów   │
│ Modele/Silniki  │     │ Zamówienia      │     │ Facety + filtry │
│ Kategorie       │     │ Auth użytk.     │     │ Sortowanie      │
│ Artykuły/Specs  │     │ Info o partnerze│     │ Paginacja       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────── E-SHOP ──┴───────────────────────┘
```

---

## 4. Struktura katalogów

```
/wolfparts
├── /autodily                        ← GŁÓWNA APLIKACJA Next.js
│   ├── /app                         ← App Router (strony + API)
│   │   ├── layout.tsx               ← Root layout
│   │   ├── page.tsx                 ← Strona główna (hero, marki, kategorie)
│   │   ├── globals.css              ← Tailwind + custom zmienne
│   │   ├── /search/page.tsx         ← Wyszukiwarka produktów
│   │   ├── /product/[id]/page.tsx   ← Detal produktu
│   │   ├── /vehicle/[engineId]/page.tsx ← Przeglądanie części wg pojazdu
│   │   ├── /vin/page.tsx            ← VIN lookup (wyłączony)
│   │   ├── /brand/[slug]/page.tsx   ← Strona marki
│   │   ├── /checkout/page.tsx       ← Checkout (formularz + podsumowanie)
│   │   ├── /prihlaseni/page.tsx     ← Logowanie
│   │   ├── /registrace/page.tsx     ← Rejestracja
│   │   ├── /admin/page.tsx          ← Panel admina
│   │   ├── /o-nas/page.tsx          ← O nás
│   │   ├── /kontakt/page.tsx        ← Kontakt
│   │   ├── /doprava/page.tsx        ← Doprava (wysyłka)
│   │   ├── /ke-stazeni/page.tsx     ← Ke stažení (do pobrania)
│   │   ├── /obchodni-podminky/page.tsx ← Obchodní podmínky
│   │   └── /api/                    ← API Routes
│   │       ├── /auth/route.ts           POST — logowanie (Nextis)
│   │       ├── /register/route.ts       POST — rejestracja (dummy order WP-REG-)
│   │       ├── /search/route.ts         POST — szukaj w Typesense
│   │       ├── /vehicles/route.ts       GET  — brands/models/engines/categories/products/enrich
│   │       ├── /vehicle-info/route.ts   GET  — zdjęcia pojazdów
│   │       ├── /vin/route.ts            GET  — VIN lookup (wyłączony)
│   │       ├── /product-live/route.ts   GET  — ceny/stany na żywo (Nextis)
│   │       ├── /product-image/route.ts  GET  — TecDoc obrazki + specs (bez scrapingu)
│   │       ├── /product-replacements/route.ts GET — zamienniki
│   │       ├── /tecdoc-image/route.ts   GET  — proxy obrazków TecDoc
│   │       ├── /cart-prices/route.ts    POST — ceny koszyka (z auth)
│   │       ├── /order-validate/route.ts POST — walidacja zamówienia
│   │       ├── /order-send/route.ts     POST — wysyłka zamówienia do Nextis
│   │       ├── /admin/run-script/route.ts POST — uruchamianie skryptów
│   │       └── /sync/route.ts           POST — webhook synchronizacji
│   ├── /components                  ← 27 komponentów React
│   │   ├── Header.tsx               ← Nagłówek + nawigacja
│   │   ├── Footer.tsx               ← Stopka
│   │   ├── HeroSearch.tsx           ← Hero sekcja z wyszukiwarką
│   │   ├── SearchBox.tsx            ← Pole wyszukiwania
│   │   ├── ProductCard.tsx          ← Karta produktu
│   │   ├── ProductGrid.tsx          ← Siatka produktów
│   │   ├── ProductDetail.tsx        ← Detal produktu
│   │   ├── ProductGallery.tsx       ← Galeria zdjęć produktu
│   │   ├── ProductImage.tsx         ← Komponent obrazka produktu
│   │   ├── LivePrice.tsx            ← Cena na żywo (z Nextis)
│   │   ├── AddToCartButton.tsx      ← Przycisk dodaj do koszyka
│   │   ├── OrderButton.tsx          ← Przycisk zamów
│   │   ├── CartDrawer.tsx           ← Wysuwany koszyk (sidebar)
│   │   ├── Filters.tsx              ← Filtry facetowe
│   │   ├── Pagination.tsx           ← Paginacja
│   │   ├── Sidebar.tsx              ← Sidebar
│   │   ├── CategoryGrid.tsx         ← Siatka kategorii
│   │   ├── BrandGrid.tsx            ← Siatka marek
│   │   ├── VehiclePickerButton.tsx  ← Przycisk wyboru pojazdu
│   │   ├── VehiclePickerModal.tsx   ← Modal wyboru pojazdu (brand→model→engine)
│   │   ├── VehicleSelector.tsx      ← Selektor pojazdów
│   │   ├── VinInput.tsx             ← Pole VIN
│   │   ├── BrakeSchematic.tsx       ← Interaktywny schemat hamulców
│   │   ├── FilterSchematic.tsx      ← Schemat filtrów
│   │   ├── SchematicSidebar.tsx     ← Sidebar schematów
│   │   ├── LoginModal.tsx           ← Modal logowania
│   │   └── SyncButton.tsx           ← Przycisk synchronizacji
│   ├── /lib                         ← Logika biznesowa
│   │   ├── nextis-api.ts            ← Klient Nextis ERP (auth, catalog, orders)
│   │   ├── tecdoc-api.ts            ← Klient TecDoc Pegasus 3.0
│   │   ├── tecdoc-data.ts           ← Dane TecDoc
│   │   ├── tecdoc-key.ts            ← Zarządzanie kluczem TecDoc API
│   │   ├── tecdoc-live.ts           ← Scraping mroauto.cz (Cheerio)
│   │   ├── typesense.ts             ← Klient Typesense + schemat kolekcji
│   │   ├── cart.tsx                  ← CartProvider (React Context + localStorage)
│   │   ├── use-auth.ts              ← Hook autoryzacji
│   │   ├── ftp.ts                   ← Klient FTP (basic-ftp)
│   │   ├── brand-logos.ts           ← Mapowanie logotypów 90+ marek
│   │   ├── category-icons.ts        ← Mapowanie ikon kategorii
│   │   └── mroauto-session.ts       ← VIN wrapper (Puppeteer — wyłączony)
│   ├── /scripts                     ← Skrypty CLI
│   │   ├── sync-products.ts         ← Sync FTP CSV → Typesense
│   │   ├── scrape-tecdoc.ts         ← Scrape TecDoc
│   │   ├── scrape-images.ts         ← Scrape obrazków produktów
│   │   ├── scrape-categories.ts     ← Scrape kategorii
│   │   └── scrape-engine-categories.ts ← Scrape kategorii silników
│   ├── /data                        ← Dane statyczne/cache
│   │   ├── /cache/                  ← Cache HTTP (disk)
│   │   ├── category-seeds.json      ← Mapowanie kategorii
│   │   └── tecdoc-vehicles.json     ← Cache bazy pojazdów TecDoc
│   ├── /public                      ← Assety statyczne
│   │   ├── /logos/cars/             ← Loga marek samochodów (~30)
│   │   ├── /logos/brands/           ← Loga producentów części (~200+)
│   │   ├── hero-bg.png
│   │   ├── logo.svg
│   │   └── test.png
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── NextisAPI.md                 ← Dokumentacja Nextis API v10.53
│   ├── AGENTS.md
│   └── CLAUDE.md
├── NEXTIS-ORDER-FLOW.md             ← Dokumentacja flow zamówień + SQL
├── Vin_mroauto.md                   ← Notatki VIN lookup
├── autodily-claude-code-prompt.md   ← Prompt do budowy projektu
├── autodily-prompt-v2-ftp.md        ← Prompt v2 z FTP sync
├── autodily-setup-windows.md        ← Setup na Windows
├── autodily-zmiany-prompt.md        ← Prompt zmian
├── scrape_category_details.py       ← Python scraper kategorii
├── Braking-System.svg               ← SVG schematu hamulców
└── test.html                        ← Testowy HTML
```

---

## 5. Flow: Wyszukiwanie produktu po pojeździe

```
Użytkownik otwiera VehiclePickerModal (lub strona główna)
    │
    ▼
GET /api/vehicles?action=brands
    → TecDoc getManufacturers() → 60+ marek (BMW, VW, Škoda...)
    │
    ▼ Wybiera markę
GET /api/vehicles?action=models&brandId=X
    → TecDoc getModelSeries(brandId) → modele (3 Series, Golf, Octavia...)
    │
    ▼ Wybiera model (z miniaturką auta z TecDoc)
GET /api/vehicles?action=engines&brandId=X&modelId=Y
    → TecDoc getVehicles(brandId, modelId) → silniki (2.0 TDI 150kW, 1.4 TSI...)
    │
    ▼ Wybiera silnik → redirect na /vehicle/[engineId]
GET /api/vehicles?action=categories&engineId=Z
    → TecDoc getCategoriesForVehicle(engineId) → drzewo kategorii
    → Ukryte: "Speciální nářadí", "Vedlejší pohon", "Pneumatický systém"
    │
    ▼ Wybiera kategorię końcową (np. "Brzdové destičky")
GET /api/vehicles?action=products&engineId=Z&categoryId=C  ← FAZA 1 (szybka ~1.5s)
    │
    ├─ a) TecDoc getBrandsForVehicleCategory() + getCategoriesForVehicle() → PARALLEL
    ├─ b) Nextis items-finding-by-vehicle (per genArtID, parallel, keep-alive agents)
    ├─ c) Deduplikacja po code+brand
    ├─ d) Typesense multiSearch batch (50/batch) → ID produktu
    │
    ▼ Wynik fazy 1:
    Lista produktów z cenami + stanami (bez zdjęć/specs)
    Frontend: paginacja 15/stronę, filtry po Výrobce
    │
    ▼ FAZA 2 (w tle ~500ms)
GET /api/vehicles?action=enrich&engineId=Z&categoryId=C&codes=...
    │
    ├─ TecDoc getArticleByCode() × N (concurrency 15) → specs + obrazki
    ├─ Buduje dynamiczne filtry (Montovaná strana, Provedení nápravy...)
    │
    ▼ Wynik fazy 2:
    Obrazki + criteria wstrzyknięte do istniejących produktów
    + pełne dynamiczne filtry
    + cache 5 min (server) + localStorage 5 min (client)
```

---

## 6. Flow: Wyszukiwanie tekstowe (Typesense)

```
Użytkownik wpisuje frazę w SearchBox / HeroSearch
    │
    ▼
POST /api/search
    {
      q: "brzdové destičky",
      page: 1,
      per_page: 24,
      filter_by: "in_stock:true && brand:TRW",
      sort_by: "price_min:asc",
      facet_by: "brand,category,in_stock"
    }
    │
    ▼
Typesense → kolekcja "products" (6M+ dokumentów)
    → full-text z typo tolerance
    → facety (brand, category, in_stock)
    → sortowanie (relevance, price ASC/DESC, stock)
    → snippety w wynikach
    │
    ▼
/search strona z:
    - ProductGrid (karty produktów)
    - Filters (facety sidebar)
    - Pagination (24/stronę, max 100 stron)
    │
    ▼ Klik na produkt
/product/[id] → detal + LivePrice z Nextis + zamienniki
```

---

## 7. Flow: Zamówienie (niezalogowany klient)

```
1. KOSZYK (client-side)
   CartProvider (React Context) → localStorage key: "cart"
   CartItem { id, productCode, brand, name, qty, price, imageUrl }
   │
   ▼
2. CHECKOUT (/checkout) — krok "form"
   Formularz: imię/firma, ulica, město, PSČ, kraj, email, telefon, IČO, DIČ
   Opcjonalnie: inna adresa dostawy (dName, dStreet, dCity, dZip)
   Notatka do zamówienia
   │
   ▼ Validacja → krok "summary"
3. PODSUMOWANIE
   Przegląd: adresy + lista produktów + suma
   │
   ▼ Klik "Odeslat objednávku" → krok "sending"
4. POST /api/order-send
   Frontend:
   - Sprawdza localStorage "auth_token" → BRAK (niezalogowany)
   - Wysyła BEZ headera x-user-token

   Backend (order-send/route.ts):
   - userToken = undefined
   - sendOrder() → buildTokenParams(undefined)
     → token: ADMIN_TOKEN, tokenIsMaster: true, tokenPartnerID: 884100

   Do Nextis idzie:
   {
     token: "85FBD424...",
     tokenIsMaster: true,
     tokenPartnerID: 884100,        ← konto "matki" WolfParts
     keepBackOrder: true,
     userOrder: "WP-1711439000000", ← prefix WP- + timestamp
     userNote: '{"n":"Jan","s":"Ulice 1","c":"Praha","z":"11000",...}',
     subCustomerInfo: { name, street, city, postcode, countryCode, phone, email },
     optionalDeliveryAddress: { addressName, street, city, postalCode },  ← opcjonalnie
     items: [{ code: "GDB1330", brand: "TRW", qty: 1 }]
   }
   │
   ▼
5. NEXTIS ERP — zamówienie ląduje na koncie partnera 884100
   │
   ▼ (co 1 minutę)
6. SQL TASK: Auto-Partner Creator v3
   - Szuka: ID_Kontakt=884100, Poznamka LIKE '{"n":"...', userOrder LIKE 'WP-%'
   - Parsuje JSON z Poznamka (JSON_VALUE)
   - Szuka partnera po emailu (EshopZak_RegEmail)
   - NIE istnieje → INSERT nowy partner do SYSTEM_Kontakty + PARTNER_Settings
   - Istnieje → używa istniejącego ID
   - UPDATE zamówienia: przepisuje ID_Kontakt, ID_Objednatel, ID_Prijemce
   - Aktualizuje adresy ODB (fakturační) + PRJ (doručovací)
   - Oznacza: "WP-DONE-..." (sukces) lub "WP-ERR-..." (błąd)
   │
   ▼
7. POTWIERDZENIE — krok "done"
   Numer zamówienia z Nextis, koszyk wyczyszczony
   "Potvrzení odešleme na jan@email.cz"
```

---

## 8. Flow: Zamówienie (zalogowany klient)

```
Różnica vs niezalogowany:

1. Logowanie (POST /api/auth)
   → Nextis /common/authentication { Login, Password }
   → Zwraca osobisty token (ważność 120 min)
   → Token w localStorage "auth_token"

2. Przy zamówieniu:
   - Frontend wysyła header x-user-token: "osobisty_token"
   - sendOrder() → buildTokenParams("osobisty_token")
     → { token: "osobisty_token", language: "cs" }
   - Zamówienie idzie NA KONTO PARTNERA (nie na 884100)
   - Ceny = indywidualne z rabatami
   - SQL task NIE przetwarza (bo ID_Kontakt != 884100)
```

---

## 9. Flow: Rejestracja nowego klienta

```
/registrace → formularz (imię, email, hasło, adres, IČO, DIČ)
    │
    ▼
POST /api/register
    → Wysyła DUMMY zamówienie na konto 884100:
    {
      userOrder: "WP-REG-{timestamp}",  ← prefix WP-REG-
      userNote: '{"n":"...","e":"...","pw":"haslo123",...}',
      items: [dummy item]
    }
    │
    ▼ (co 1 minutę)
SQL Task v3:
    - Rozpoznaje WP-REG- → @IsRegistration = 1
    - Tworzy partnera (z hasłem z $.pw jeśli >= 6 znaków)
    - Anuluje dummy zamówienie (Stav = -1)
    - Oznacza: "WP-DONE-REG-..."
    │
    ▼
Partner istnieje w Nextis → użytkownik może się zalogować
```

---

## 10. Pipeline synchronizacji produktów

```
Nextis MSSQL (SQL export query)
    │
    ▼ Generuje CSV na FTP
FTP: ftpstorage.nextis.cz:/exports/produkty.csv (~500MB)
    │ Format: semicolon-delimited, UTF-8 BOM
    │ Pola: ProductID;ProductCode;Name;Description;Brand;Category;
    │        RetailPriceMin;RetailPriceMax;TotalStock;ImageURL;
    │        OEMNumbers;CrossNumbers
    │
    ▼ npm run sync:full (lub webhook POST /api/sync)
scripts/sync-products.ts
    - Łączy się z FTP (basic-ftp)
    - Stream-parsuje CSV (csv-parse) → nie ładuje 500MB do RAM
    - Transformuje: productCode → product_code, OEM pipe-split → array
    - Batch upsert do Typesense (1000 items/batch)
    │
    ▼
Typesense Cloud: kolekcja "products"
    Schemat: id, product_code, name, description, brand, category,
             price_min, price_max, in_stock, stock_qty,
             image_url, oem_numbers[], cross_numbers[]
```

### SQL eksportu (uruchamiany w Nextis):
```sql
SELECT TOP 10000000
    g.ID AS ProductID, g.ProductCode, g.Name,
    ISNULL(NULLIF(g.EshopDescription, ''), g.Description) AS Description,
    g.TecDocBrandName AS Brand, g.SubGoupName AS Category,
    MIN(g.RetailPrice) AS RetailPriceMin, MAX(g.RetailPrice) AS RetailPriceMax,
    (SELECT SUM(sd.OnStockQuantity) ...) AS TotalStock,
    (SELECT TOP 1 i.ImageURL ...) AS ImageURL,
    (OE codes pipe-separated) AS OEMNumbers,
    (Cross numbers pipe-separated) AS CrossNumbers
FROM API_GetProductGroups g
WHERE g.IsArchiving = 0 AND g.IsHiddenOnEshop = 0
GROUP BY ...
```

---

## 11. Zarządzanie tokenami

| Token | Źródło | Ważność | Użycie |
|-------|--------|---------|--------|
| Master (admin) | `.env NEXTIS_TOKEN_ADMIN` | Stały | Katalog, ceny katalogowe, zamówienia gości |
| User (osobisty) | `POST /common/authentication` | 120 min | Ceny indywidualne, zamówienia zalogowanych |
| TecDoc API key | Auto-refresh z TecAlliance | ~1h | Dane pojazdów, artykuły, obrazki |
| Typesense Admin | `.env TYPESENSE_ADMIN_KEY` | Stały | Zapis/sync produktów |
| Typesense Search | `.env TYPESENSE_SEARCH_KEY` | Stały | Wyszukiwanie (read-only) |

### buildTokenParams():
```
userToken podany?  → { token: userToken, language: "cs" }
brak userToken?    → { token: ADMIN_TOKEN, tokenIsMaster: true, tokenPartnerID: 884100, language: "cs" }
```

---

## 12. Kluczowe tabele Nextis DB

| Tabela | Cel |
|--------|-----|
| `SYSTEM_Kontakty` | Partnerzy (klienci) — ID, nazwa, adres, email, hasło, cenová skupina |
| `PARTNER_Settings` | Ustawienia partnera (cenníky, TecDoc, limity) |
| `OBJEDNAVKY` | Zamówienia — nagłówek (ID_Kontakt, adresy, status) |
| `OBJEDNAVKY_Polozky` | Pozycje zamówień |
| `PARTNER_Addresses` | Adresy dostawcze partnerów |
| `API_GetProductGroups` | VIEW — grupy produktów (do eksportu) |
| `API_GetProducts` | VIEW — produkty |
| `API_GetStockDispositions` | VIEW — stany magazynowe |
| `API_GetImage` | VIEW — obrazki produktów |
| `API_GetCrossNumbers` | VIEW — numery cross/zamienników |
| `SKLAD_Produkty_OE_Connection` + `_OE_List` | Numery OE |

---

## 13. Konfiguracja środowiskowa (.env.local)

```
# FTP
FTP_HOST=ftpstorage.nextis.cz
FTP_USER=mroauto_profit
FTP_PASSWORD=z2xC83vBa
FTP_PRODUCTS_PATH=/sqqll

# Nextis API
NEXTIS_API_URL=https://api.mroauto.nextis.cz
NEXTIS_API_LOGIN=wolfparts
NEXTIS_API_PASSWORD=wolfparts1
NEXTIS_TOKEN_ADMIN=85FBD424238A40A1A095586427926FD2
NEXTIS_DEFAULT_PARTNER_ID=884100

# Typesense
TYPESENSE_HOST=vu7nzds2agfw3850p-1.a2.typesense.net
TYPESENSE_ADMIN_KEY=JFT7m1pGbLsfVl1j5QkASyPPYQ2X0mEP
TYPESENSE_SEARCH_KEY=F6toka3Owvt5Z6DbzHdUQI1kt7Ks2djJ
NEXT_PUBLIC_TYPESENSE_HOST=vu7nzds2agfw3850p-1.a2.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=F6toka3Owvt5Z6DbzHdUQI1kt7Ks2djJ

# Sync webhook
SYNC_SECRET=LsfVl1j5QkYQ2X0mEPddksdsASyPPYQ2X0mEP

# MSSQL
MSSQL_HOST=sqlhost7.48.nextis.cz
MSSQL_DATABASE=nextis_mroauto
MSSQL_USER=Durczok
MSSQL_PASSWORD=1369
```

---

## 14. NPM Scripts

```bash
# Dev & Build
npm run dev                    # Dev server (localhost:3000)
npm run build                  # Production build
npm run start                  # Production server

# Sync produktów (FTP CSV → Typesense)
npm run sync:full              # Pełny sync
npm run sync:reset             # Reset kolekcji + sync
npm run sync:test              # Sync pierwszych 500
npm run sync:dry               # Dry run (sprawdzenie FTP)

# Scraping
npm run scrape:tecdoc          # Scrape TecDoc
npm run scrape:tecdoc:all      # Scrape all TecDoc
npm run scrape:images          # Obrazki produktów
npm run scrape:images:500      # Pierwsze 500 obrazków
npm run scrape:images:all      # Wszystkie obrazki
npm run scrape:cars            # Zdjęcia samochodów
npm run scrape:cars:all        # Wszystkie zdjęcia aut
npm run scrape:cars:100        # Pierwsze 100 zdjęć aut
```

---

## 15. Styling — paleta kolorów

| Zmienna | Kolor | Hex | Użycie |
|---------|-------|-----|--------|
| `--color-primary` | Czerwony WolfParts | `#E8192C` | CTA, akcenty, logo |
| `--color-primary-dark` | Ciemny czerwony | `#C41424` | Hover na primary |
| `--color-accent` | Pomarańczowy | `#FF6B35` | Drugorzędne akcenty |
| `--color-mlbg` | Prawie czarny | `#0F1117` | Hero, dark sections |
| `--color-card` | Ciemny | `#1A1D27` | Karty na dark bg |
| `--color-mltext-dark` | Ciemnoszary | `#374151` | Tekst główny |
| `--color-mltext-light` | Szary | `#6B7280` | Tekst drugorzędny |
| `--color-mlgreen` | Zielony | `#10B981` | Sukces, "na sklade" |
| `--color-warning` | Bursztynowy | `#F59E0B` | Ostrzeżenia |

---

## 16. Co działa / co nie działa

### Działa:
- [x] Strona główna z hero, markami, kategoriami
- [x] Wyszukiwarka pełnotekstowa (Typesense) z facetami i sortowaniem
- [x] Przeglądanie części wg pojazdu (TecDoc → Nextis)
- [x] Vehicle Picker Modal (brand → model → engine) z miniaturkami
- [x] Detal produktu z ceną na żywo z Nextis
- [x] Koszyk (localStorage) z drawer-em
- [x] Checkout niezalogowany (→ konto matki 884100 → SQL auto-partner)
- [x] Checkout zalogowany (→ osobisty token → indywidualne ceny)
- [x] Logowanie (Nextis auth → token 120 min)
- [x] Rejestracja (dummy order WP-REG- → SQL tworzy partnera)
- [x] Sync produktów FTP CSV → Typesense (6M+)
- [x] Admin panel (uruchamianie skryptów sync/scrape)
- [x] Proxy obrazków (produkty + TecDoc auta)
- [x] Dynamiczne filtry na stronie vehicle (specs z TecDoc)
- [x] Strony statyczne (o nas, kontakt, doprava, obchodní podmínky)
- [x] **NOWE 26.03** Redesign kategorii w stylu GAFA Auto (duże karty 3-kolumnowe z listą podkategorii)
- [x] **NOWE 26.03** Lewy sidebar kategorii — chowany drawer z czerwonym przyciskiem toggle
- [x] **NOWE 26.03** Wyszukiwarka kategorii z obsługą czeskich diakrytyków (č→c, ř→r, ž→z)
- [x] **NOWE 26.03** 2-fazowe ładowanie produktów (szybka faza ~1.5s + enrichment w tle ~500ms)
- [x] **NOWE 26.03** Frontend paginacja 15/stronę (filtry działają na WSZYSTKICH produktach)
- [x] **NOWE 26.03** Typesense multiSearch batching (48 lookupów: 881ms → 195ms)
- [x] **NOWE 26.03** HTTP keep-alive agents dla Nextis API (maxSockets: 20)
- [x] **NOWE 26.03** ProductThumb — czysty komponent wyświetlający (zero indywidualnych fetch)

### Nie działa / wyłączone:
- [ ] VIN lookup — wymaga Puppeteer, nie zainstalowany w produkcji
- [ ] Scraping mroauto.cz — usunięty (był w product-image, dodawał 8s/request)

### Do zrobienia / potencjalne usprawnienia:
- [ ] Email z potwierdzeniem zamówienia (brak implementacji)
- [ ] Historia zamówień dla zalogowanego
- [ ] Zapomniałem hasła / reset hasła
- [ ] SEO (meta tagi, sitemap, structured data)
- [ ] Responsywność — do weryfikacji na mobile
- [ ] Nextis API serializuje requesty per token — zbadać czy da się batchować genArtIDs w jednym callu
- [ ] Usunąć performance logi z vehicles/route.ts po zakończeniu optymalizacji

---

## 17. Ważne stałe w Nextis DB

| Stała | Wartość | Znaczenie |
|-------|---------|-----------|
| Partner WolfParts | 884100 | Konto "matki" na zamówienia gości |
| ID_Mena | 144 | CZK (česká koruna) |
| Stat | 15797 | CZ (Česká republika) |
| ID_Zavedl | 45 | Kto stworzył (system) |
| Price_GlobalPricing | 1 | Globalny cennik (konieczne!) |
| Eshop_IDStredisko | 1 | Středisko Bohumín |
| Eshop_IDSklad | 1 | Sklad Bohumín |
| Eshop_IDProvozovna | 1 | Provozovna Bohumín |

---

## 18. Bezpieczeństwo zamówień

1. **`WP-DONE-`** — przetworzone zamówienia nie wchodzą ponownie do pętli
2. **`WP-ERR-`** — błąd oznaczany, nie blokuje kolejnych
3. **`BEGIN TRY/CATCH`** — izolacja błędów per zamówienie
4. **Deduplikacja po emailu** — jeden partner na email
5. **Zamówienie zawsze istnieje** — nawet przy błędzie SQL, dane są w Poznamka na koncie 884100
6. **Token master** — nie eksponowany na frontend, tylko server-side

---

---

## 19. Optymalizacje wydajności (26.03.2026)

### Problem: ładowanie produktów 3-6 sekund
Źródła opóźnień zidentyfikowane przez logi:
- TecDoc brands+cats: ~500ms-2.7s (cold cache)
- Nextis items-finding-by-vehicle: ~1.3s per call (API serializuje per token)
- Typesense: 881ms dla 48 indywidualnych lookupów
- TecDoc getArticleByCode: ~500ms-1.5s per artykuł (15+ artykułów)
- ProductThumb: 15 indywidualnych fetch do /api/product-image (~1-1.5s każdy)

### Rozwiązania zastosowane:

| Optymalizacja | Przed | Po |
|---|---|---|
| TecDoc brands + cats | Sekwencyjne | **Promise.all (parallel)** |
| Typesense lookups | N indywidualnych search | **multiSearch batch (50/batch)**: 881ms → 195ms |
| HTTP connections | Nowe per request | **Keep-alive agents** (maxSockets: 20) |
| TecDoc enrichment | W głównym request | **Osobny endpoint /enrich** (faza 2 w tle) |
| ProductThumb | Fetch /product-image per produkt | **Czysty komponent** (props only, zero fetch) |
| Paginacja | Wszystkie produkty od razu | **15/stronę** (filtry na pełnym zbiorze) |
| Cache client | Brak | **localStorage 5min TTL** (products + enrichment) |

### Wynik: TOTAL 6.26s → 1.57s + 0.5s enrichment w tle

### Architektura 2-fazowego ładowania:
```
Faza 1: /api/vehicles?action=products (~1.5s)
  → TecDoc genArtIDs + Nextis ceny/stany + Typesense batch
  → Frontend: natychmiast renderuje produkty (ceny, stany, nazwy)
  → Paginacja 15/stronę, filtr po Výrobce

Faza 2: /api/vehicles?action=enrich (~0.5s, w tle)
  → TecDoc getArticleByCode × N (concurrency 15)
  → Zwraca: obrazki + criteria (specs)
  → Frontend: wstrzykuje do istniejących produktów + dodaje filtry dynamiczne
  → Cache: server 5min (vehicleProductsCache) + client localStorage 5min
```

---

## 20. Redesign strony kategorii (26.03.2026)

### Styl GAFA Auto — duże karty kategorii:
- Root level: 3-kolumnowa siatka z dużymi kartami
- Każda karta: ikona/zdjęcie + nazwa kategorii + lista podkategorii inline
- Podkategorie pobierane równolegle (Promise.all) dla wszystkich root categories
- Klik na podkategorię → bezpośrednio do produktów

### Sidebar kategorii:
- Domyślnie **UKRYTY** (drawer)
- Czerwony przycisk toggle (strzałka) na lewym marginesie
- Animowany slide-out z backdrop overlay
- Na liście produktów: filtry domyślnie **WIDOCZNE** (z margin-left dla toggle)

### Wyszukiwarka kategorii:
- Input nad siatką kategorii
- Dynamiczne ukrywanie kafli (nie pasujące → display:none)
- Obsługa czeskich diakrytyków: `String.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`
- Szuka po nazwie kategorii + nazwach podkategorii

---

*Dokument zaktualizowany 26.03.2026 wieczorem. Poprzednia wersja: 08:30.*
