# AutoDíly — Setup na nowym PC (Windows)

## 1. Klonuj repo i zainstaluj

```bash
git clone https://github.com/Dzudzok/wolfparts.git
cd wolfparts/autodily
npm install
```

## 2. Utwórz plik `.env.local`

Skopiuj `autodily/.env.local.example` i uzupełnij prawdziwe dane:

```
# FTP (eksport CSV z Nextis ERP)
FTP_HOST=ftpstorage.nextis.cz
FTP_USER=mroauto_profit
FTP_PASSWORD=z2xC83vBa
FTP_PRODUCTS_PATH=/sqqll

# Nextis REST API (live ceny, zamówienia)
NEXTIS_API_URL=https://api.mroauto.nextis.cz
NEXTIS_API_LOGIN=test1
NEXTIS_API_PASSWORD=test11

# Typesense
TYPESENSE_HOST=vu7nzds2agfw3850p-1.a2.typesense.net
TYPESENSE_ADMIN_KEY=JFT7m1pGbLsfVl1j5QkASyPPYQ2X0mEP
TYPESENSE_SEARCH_KEY=F6toka3Owvt5Z6DbzHdUQI1kt7Ks2djJ
NEXT_PUBLIC_TYPESENSE_HOST=vu7nzds2agfw3850p-1.a2.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=F6toka3Owvt5Z6DbzHdUQI1kt7Ks2djJ

# Sync webhook
SYNC_SECRET=LsfVl1j5QkYQ2X0mEPddksdsASyPPYQ2X0mEP
NEXT_PUBLIC_SYNC_SECRET=LsfVl1j5QkYQ2X0mEPddksdsASyPPYQ2X0mEP
```

## 3. Scrapuj TecDoc dane pojazdów (potrzebne do vehicle search)

```bash
# Popularne marki (~35, ~30 min):
npx tsx scripts/scrape-tecdoc.ts

# Albo szybki test z jedną marką:
npx tsx scripts/scrape-tecdoc.ts --brand skoda
```

Wynik: `data/tecdoc-vehicles.json` (~28k silników)

## 4. Sync produktów do Typesense (jeśli Typesense jest pusty)

```bash
# Test z 500 produktami:
npm run sync:test

# Pełny sync (~1M produktów, może przerwać się po ~200k z powodu EPIPE):
npm run sync:full
```

## 5. Uruchom dev server

```bash
npm run dev
```

Otwórz http://localhost:3000

---

## Architektura

```
autodily/
├── app/
│   ├── page.tsx                    # Strona główna (SearchBox + VehicleSelector)
│   ├── search/page.tsx             # Wyniki wyszukiwania Typesense z filtrami
│   ├── product/[id]/page.tsx       # Szczegóły produktu z live ceną z Nextis
│   ├── vehicle/[engineId]/page.tsx # Wyszukiwanie po pojeździe (kategorie + produkty)
│   └── api/
│       ├── search/route.ts         # Proxy Typesense search
│       ├── sync/route.ts           # Webhook do synchronizacji CSV→Typesense
│       ├── product-live/route.ts   # Live cena z Nextis API
│       ├── order-validate/route.ts # Walidacja zamówienia
│       ├── order-send/route.ts     # Wysłanie zamówienia
│       └── vehicles/route.ts       # Vehicle search API (brands/models/engines/categories/products)
├── components/
│   ├── SearchBox.tsx               # Pole wyszukiwania
│   ├── VehicleSelector.tsx         # Dropdowny: marka → model → silnik
│   ├── ProductCard.tsx             # Karta produktu
│   ├── ProductGrid.tsx             # Grid produktów
│   ├── ProductDetail.tsx           # Szczegóły z live ceną
│   ├── Filters.tsx                 # Filtry (marka, kategoria, w magazynie)
│   ├── Pagination.tsx              # Paginacja
│   ├── OrderButton.tsx             # Przycisk zamówienia
│   └── SyncButton.tsx              # Przycisk synchronizacji
├── lib/
│   ├── typesense.ts                # Klient Typesense + schemat kolekcji
│   ├── sync.ts                     # Sync CSV z FTP → Typesense
│   ├── ftp.ts                      # Klient FTP
│   ├── nextis-api.ts               # Nextis REST API (auth, ceny, zamówienia, findByVehicle)
│   ├── tecdoc-data.ts              # Offline JSON z markami/modelami/silnikami
│   └── tecdoc-live.ts              # Live/cached scraping kategorii z mroauto.cz
├── scripts/
│   ├── sync-products.ts            # CLI sync: npx tsx scripts/sync-products.ts
│   ├── scrape-tecdoc.ts            # Scraper TecDoc: marki → modele → silniki
│   ├── scrape-categories.ts        # Scraper kategorii z genArtIDs
│   └── scrape-engine-categories.ts # Scraper kategorii per silnik (offline)
├── data/
│   └── tecdoc-vehicles.json        # Offline mapa pojazdów (scrape wynik)
└── .env.local                      # Klucze (nie commitowany)
```

## Kluczowe endpointy Nextis API

- `POST /common/authentication` — login → token
- `POST /catalogs/items-checking-by-id` — live ceny/stany po ID produktu ✅ działa
- `POST /catalogs/items-finding-by-vehicle` — szukanie po engineID+genArtID ❌ zwraca 500 (bug po stronie Nextis, do naprawienia)
- `POST /orders/validation` — walidacja zamówienia
- `POST /orders/sending` — wysłanie zamówienia

## Vehicle search — obecny stan i TODO

**Co działa:**
- Wybór pojazdu: marka → model → silnik (z offline JSON)
- Drzewo kategorii z mroauto.cz (live + disk cache 24h)
- Produkty z leaf kategorii matched w Typesense po product_code

**Problem:**
- Live scraping mroauto.cz = ryzyko blokady + wolne przy pierwszym ładowaniu
- Nextis API `items-finding-by-vehicle` zwraca 500

**TODO — priorytet:**
1. Naprawić Nextis API `items-finding-by-vehicle` (zgłosić do Nextis)
2. Jak API zacznie działać → wyrzucić scraping mroauto.cz, użyć API do pobierania dílów per silnik
3. Alternatywa: zapytać Nextis o export CSV z mapowaniem TecDoc vehicle→products na FTP

## Znane problemy

- **Sync EPIPE** — pełny sync (~1M produktów) przerywa się po ~200k. Potrzebuje retry logic.
- **Typesense 422** — niektóre batche mają za długie pola. ~45k błędów z ~1M.
- **CSV quote bug** — rozwiązany: `quote: false` + ręczny `stripQuotes()`.
