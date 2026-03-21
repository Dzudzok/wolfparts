# Nextis ERP API – Dokumentacja (v10.53)

**Operator:** MROAUTO AUTODÍLY s.r.o.  
**Adres:** Čs. armády 360, 735 51 Bohumín Pudlov, CZ  
**TAX ID:** 06630405  
**API Server:** `https://api.mroauto.nextis.cz`  
**Wersja:** v10.53

---

## Autentykacja

Wszystkie endpointy (poza `/common/authentication`) wymagają tokenu API w polu `token` w body requesta.  
> Domyślna ważność tokenu: **120 minut**

---

## Kody statusu HTTP

| Kod | Opis |
|-----|------|
| 200 | OK – sukces |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 500 | Internal Server Error |
| 501 | Not Implemented |

---

## Wartości pola `status` w odpowiedzi

`OK` | `BadRequest` | `Unauthenticated` | `Forbidden` | `ProcessingError` | `NotImplemented` | `RequestLimitExceeded` | `CommunicationError`

---

## Dozwolone wartości `language`

`cs` `pl` `en` `de` `sk` `hu` `nl` `ru` `et` `lv` `lt` `ar` `fr` `it` `pt` `ro` `es` `tr` `bg` `sl` `sr` `hr` `gr` `da` `fi` `lb` `sv` `ua` `sh` `no` `is` `ga` `mt` `el` `la` `_NA`

---

## Skrócona tabela endpointów

| # | Metoda | Endpoint | Opis |
|---|--------|----------|------|
| 1 | POST | `/catalogs/items-checking` | Sprawdź pozycje katalogu (po kodzie i marce) |
| 2 | POST | `/catalogs/items-checking-by-id` | Sprawdź pozycje katalogu (po ID) |
| 3 | POST | `/catalogs/items-finding-by-code` | Znajdź pozycje katalogu (po kodzie TecDoc) |
| 4 | POST | `/catalogs/items-finding-by-vehicle` | Znajdź pozycje katalogu (po pojeździe TecDoc) |
| 5 | POST | `/common/authentication` | Autentykacja – uzyskanie tokenu |
| 6 | POST | `/documents/deliverynotes` | Pobierz listę dokumentów WZ |
| 7 | POST | `/documents/invoice-file` | Pobierz plik faktury (PDF) |
| 8 | POST | `/documents/invoices` | Pobierz listę faktur |
| 9 | POST | `/orders/sending` | Wyślij zamówienie |
| 10 | POST | `/orders/validation` | Zwaliduj zamówienie |
| 11 | POST | `/partners/credit` | Pobierz info o kredycie partnera |
| 12 | POST | `/partners/info` | Pobierz info o partnerze |

---

---

# 1. CATALOGS

---

## 1.1 Check catalog items (common)
```
POST /catalogs/items-checking
```

Sprawdzanie pozycji katalogu "na żądanie" według kodu i marki. Obsługuje wiele pozycji jednocześnie.  
**Limity domyślne:** 100 requestów/dzień, 1000 pozycji/request *(mogą być zmienione przez operatora)*

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token, 1–40 znaków |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język odpowiedzi |
| `getEANCodes` | boolean | nie | Pobierz kody EAN/barcode (jeśli dozwolone) |
| `getOECodes` | boolean | nie | Pobierz kody OE (jeśli dozwolone) |
| `getServices` | boolean | nie | Pobierz pozycje nie-towarowe (usługi) |
| `getDeposits` | boolean | nie | Pobierz depozyty/kaucje |
| `getCashBack` | boolean | nie | Pobierz informacje cashback (jeśli dozwolone) |
| `items` | array | TAK | Lista pozycji do sprawdzenia |
| `searchTarget` | enum | nie | `CodeMain` / `CodeOE` / `CodeEAN` / `CodeInternal` / `InternalID` |
| `trySearchWithoutManufacturer` | boolean | nie | Szukaj bez producenta |

#### Struktura `items[]`

| Pole | Typ | Opis |
|------|-----|------|
| `prefix` | string\|null | Prefix kodu (aktualnie tylko Motoprofil PL, dla innych nieużywane) |
| `code` | string\|null | Kod pozycji katalogu |
| `brand` | string\|null | Nazwa lub ID marki (jedno musi być podane jako string w cudzysłowie) |
| `pairID` | integer | Default: -1. Własny ID do parowania zwróconej pozycji |
| `internalID` | integer | Default: -1. Wyszukiwanie przez wewnętrzny ID (wymaga `searchTarget = "InternalID"`) |
| `requestedQty` | number | Żądana ilość |
| `searchTarget` | enum | `CodeMain` / `CodeOE` / `CodeEAN` / `CodeInternal` / `InternalID` |
| `trySearchWithoutManufacturer` | boolean | Szukaj bez producenta |

### Response 200 – `CheckItemResponse`

| Pole | Typ | Opis |
|------|-----|------|
| `status` | enum | Status odpowiedzi |
| `statusText` | string\|null | Opis statusu |
| `duration` | integer | Czas przetwarzania (ms) |
| `items` | array | Lista zwróconych pozycji |
| `successRatio` | number | Stosunek znalezionych pozycji (100 = wszystkie znaleziono) |

#### Struktura `items[].requestItem` (echo żądania)

| Pole | Typ | Opis |
|------|-----|------|
| `prefix` | string\|null | Prefix kodu |
| `code` | string\|null | Kod pozycji |
| `brand` | string\|null | Marka |
| `pairID` | integer | Własny ID pary |
| `internalID` | integer | Wewnętrzny ID |
| `requestedQty` | number | Żądana ilość |

#### Struktura `items[].responseItem` – **dane produktu**

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Wewnętrzny ID pozycji w systemie |
| `valid` | boolean | Pozycja prawidłowo załadowana |
| `itemType` | enum | Typ pozycji: `goods` / `service` / `rounding` |
| `productPrefix` | string\|null | Prefix kodu produktu |
| `productCode` | string\|null | Kod produktu |
| `productBrand` | string\|null | Marka produktu |
| `productName` | string\|null | Nazwa produktu |
| `productDescription` | string\|null | Dodatkowy opis produktu |
| **`price`** | **object** | **Informacje cenowe** |
| `price.unitPrice` | number | Cena jednostkowa netto |
| `price.unitPriceIncVAT` | number | Cena jednostkowa brutto (z VAT) |
| `price.discount` | number | Rabat w procentach |
| `price.unitPriceRetail` | number | Cena detaliczna netto |
| `price.unitPriceRetailIncVAT` | number | Cena detaliczna brutto |
| `price.note` | string\|null | Notatka do ceny |
| `price.reliability` | enum | `PriceIsConstant` / `PriceMayVary` / `NoInformation` – czy cena może się zmienić |
| `price.reliabilityOverQty` | number | Ilość, od której cena może się zmienić |
| `price.valid` | boolean | Cena prawidłowo załadowana |
| `price.currency` | enum | Waluta (`CZK` / `USD` / `SKK` / `EUR` / `DKK` / `HUF` / `PLN` / `SEK` / `GBP` / `NOK` / itd.) |
| `price.vatRate` | number | Aktualna stawka VAT pozycji |
| `qtyAvailableMain` | number | Dostępna ilość w przypisanym magazynie |
| **`qtyAvailableMainDetailed`** | **object** | **Szczegółowa dostępność główna** |
| `qtyAvailableMainDetailed.idWarehouse` | integer | Wewnętrzny ID magazynu |
| `qtyAvailableMainDetailed.warehouseName` | string\|null | Nazwa magazynu |
| `qtyAvailableMainDetailed.qty` | number | Dostępna ilość |
| `qtyAvailableMainDetailed.qtyAvailableProduction` | number | Ilość niedostępna natychmiast, ale możliwa do skompletowania przez dostawcę |
| **`qtyAvailableOther`** | **array** | **Dostępność w innych magazynach** |
| `qtyAvailableOther[].idWarehouse` | integer | Wewnętrzny ID magazynu |
| `qtyAvailableOther[].warehouseName` | string\|null | Nazwa magazynu |
| `qtyAvailableOther[].qty` | number | Dostępna ilość |
| `qtyAvailableSupplier` | number | Ilość dostępna u dostawców systemu docelowego |
| `qtyPackage` | number | Ilość w jednym opakowaniu |
| `qtyMinimal` | number | Minimalna ilość zamówienia (MOQ) |
| `qtyMultiply` | number | Minimalna wielokrotność zamówienia |
| `baseUnit` | enum | Jednostka miary: `Piece` / `Milliter` / `Milimeter` / `Decimeter` / `Meter` / `Miligram` / `Kilogram` / `Package` / `Liter` |
| **`deposits`** | **array** | **Depozyty/kaucje powiązane z pozycją** |
| `deposits[].type` | enum | `NonGoods` / `Goods` – typ depozytu |
| `deposits[].code` | string\|null | Kod pozycji depozytu |
| `deposits[].brand` | string\|null | Marka depozytu |
| `deposits[].qty` | number | Ilość depozytu na jednostkę |
| `deposits[].name` | string\|null | Nazwa/opis depozytu |
| `deposits[].price` | object | Cena depozytu (ta sama struktura co `price` powyżej) |
| **`oeCodes`** | **array** | **Lista kodów OE** |
| `oeCodes[].code` | string\|null | Kod OE |
| `oeCodes[].manufacturer` | string\|null | Producent OE |
| `notes` | [string] | Lista notatek do pozycji |
| `barCodes` | [string] | Lista kodów kreskowych (EAN) |
| `instrastatCode` | string\|null | Kod do raportowania Intrastat |
| `weightKg` | number | Waga netto pozycji/opakowania (kg) |
| `returnNote` | string\|null | Notatka zwrotna (jeśli podana) |

### Przykład Request
```json
{
  "token": "ABC123TOKEN",
  "tokenIsMaster": false,
  "tokenPartnerID": 0,
  "language": "pl",
  "getEANCodes": true,
  "getOECodes": true,
  "getServices": false,
  "getDeposits": true,
  "getCashBack": false,
  "items": [
    {
      "code": "BP980",
      "brand": "BOSCH",
      "pairID": -1,
      "internalID": -1,
      "requestedQty": 2,
      "searchTarget": "CodeMain"
    }
  ]
}
```

### Przykład Response
```json
{
  "status": "OK",
  "duration": 312,
  "successRatio": 100,
  "items": [
    {
      "requestItem": { "code": "BP980", "brand": "BOSCH", "pairID": -1 },
      "responseItem": {
        "id": 45123,
        "valid": true,
        "itemType": "goods",
        "productCode": "BP980",
        "productBrand": "BOSCH",
        "productName": "Tarcza hamulcowa",
        "price": {
          "unitPrice": 85.50,
          "unitPriceIncVAT": 103.46,
          "discount": 15,
          "currency": "CZK",
          "vatRate": 21,
          "reliability": "PriceIsConstant"
        },
        "qtyAvailableMain": 12,
        "qtyAvailableMainDetailed": {
          "idWarehouse": 1,
          "warehouseName": "Bohumin",
          "qty": 12
        },
        "qtyAvailableOther": [],
        "qtyPackage": 1,
        "qtyMinimal": 1,
        "baseUnit": "Piece",
        "oeCodes": [{ "code": "1234567", "manufacturer": "VW" }],
        "barCodes": ["4047024123456"],
        "weightKg": 1.2
      }
    }
  ]
}
```

---

## 1.2 Check catalog items (by id)
```
POST /catalogs/items-checking-by-id
```

Sprawdzanie pozycji "na żądanie" według wewnętrznego ID systemu.  
**Limity domyślne:** 100 requestów/dzień, 1000 pozycji/request

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token, 1–40 znaków |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `getEANCodes` | boolean | nie | Pobierz kody EAN |
| `getOECodes` | boolean | nie | Pobierz kody OE |
| `getServices` | boolean | nie | Pozycje nie-towarowe |
| `getDeposits` | boolean | nie | Depozyty |
| `getCashBack` | boolean | nie | Cashback |
| `items` | array | TAK | Lista `[{ "id": integer }]` |

### Response 200

Identyczna struktura jak w **1.1**, pola `responseItem` takie same.

---

## 1.3 Find catalog items (by code)
```
POST /catalogs/items-finding-by-code
```

Wyszukiwanie pozycji według kodu TecDoc (EngineID / K-type).  
**Limity domyślne:** 100 requestów/dzień, 1000 pozycji/request

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `getEANCodes` | boolean | nie | Pobierz kody EAN |
| `getOECodes` | boolean | nie | Pobierz kody OE |
| `getServices` | boolean | nie | Pozycje nie-towarowe |
| `getDeposits` | boolean | nie | Depozyty |
| `getCashBack` | boolean | nie | Cashback |
| `code` | string | TAK | Kod TecDoc (EngineID / K-type), min 1 znak |
| `brandIDs` | [integer] | nie | Filtr wg listy ID marek TecDoc |
| `target` | enum | TAK | `P` / `O` / `M` / `A` / `K` / `H` / `B` / `V` / `L` / `T` / `NA` |
| `genArtID` | integer | TAK | ID artykułu generycznego TecDoc |

### Response 200

Identyczna struktura jak w **1.1**.

---

## 1.4 Find catalog items (by vehicle)
```
POST /catalogs/items-finding-by-vehicle
```

Wyszukiwanie pozycji według ID pojazdu z bazy TecDoc.  
**Limity domyślne:** 100 requestów/dzień, 1000 pozycji/request

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `getEANCodes` | boolean | nie | Pobierz kody EAN |
| `getOECodes` | boolean | nie | Pobierz kody OE |
| `getServices` | boolean | nie | Pozycje nie-towarowe |
| `getDeposits` | boolean | nie | Depozyty |
| `getCashBack` | boolean | nie | Cashback |
| `engineID` | integer | TAK | EngineID pojazdu TecDoc (K-type) |
| `target` | enum | TAK | `P` / `O` / `M` / `A` / `K` / `H` / `B` / `V` / `L` / `T` / `NA` |
| `genArtID` | integer | TAK | ID artykułu generycznego TecDoc |

### Response 200

Identyczna struktura jak w **1.1**.

---

---

# 2. COMMON

---

## 2.1 Authenticate user (obtaining the token)
```
POST /common/authentication
```

Zwraca token API niezbędny do wywołań wszystkich pozostałych endpointów.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `login` | string | TAK | Login uzyskany od właściciela API, min 1 znak |
| `password` | string | TAK | Hasło uzyskane od właściciela API, min 1 znak |

### Response 200 – `AuthenticateResponse`

| Pole | Typ | Opis |
|------|-----|------|
| `status` | enum | Status |
| `statusText` | string\|null | Opis statusu |
| `duration` | integer | Czas (ms) |
| `token` | string\|null | Klucz API (wypełniony gdy autentykacja się powiodła) |
| `tokenValidTo` | date-time | Ważność tokenu (domyślnie 120 min) |

### Przykład
```json
// Request
{ "login": "twoj_login", "password": "twoje_haslo" }

// Response
{
  "status": "OK",
  "token": "a1b2c3d4TOKEN",
  "tokenValidTo": "2026-03-21T14:00:00Z",
  "duration": 145
}
```

---

---

# 3. DOCUMENTS

---

## 3.1 Get delivery notes
```
POST /documents/deliverynotes
```

Zwraca listę dokumentów WZ w podanym zakresie dat.  
> Jeśli token należy do centrali: `loadAll = true` zwraca WZ dla wszystkich oddziałów.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `dateFrom` | date-time | TAK | Początek zakresu (zawsze traktowany jako **początek** dnia) |
| `dateTo` | date-time | TAK | Koniec zakresu (zawsze traktowany jako **koniec** dnia) |
| `loadAll` | boolean | nie | True = wszystkie oddziały (tylko dla centrali). Default: true |

### Response 200 – `DocumentListResponse`

| Pole | Typ | Opis |
|------|-----|------|
| `status` | enum | Status |
| `statusText` | string\|null | Opis statusu |
| `duration` | integer | Czas (ms) |
| `items` | array | **Lista dokumentów WZ** |

#### Struktura `items[]` – dokument WZ

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Wewnętrzny ID dokumentu |
| `type` | enum | `Invoice` / `Receipt` / `DeliveryNote` / `CorrectionNote` / `ProformaInvoice` / `unknown` |
| `dateIssued` | date-time | Data wystawienia dokumentu |
| `no` | string\|null | Numer dokumentu (sekwencja) |
| **`items`** | **array** | **Lista pozycji dokumentu** |
| `items[].id` | integer | Wewnętrzny ID pozycji dokumentu |
| `items[].type` | enum | `goods` / `nongoods` / `rounding` – typ pozycji |
| `items[].code` | string\|null | Kod pozycji (dla towarów i usług) |
| `items[].brand` | string\|null | Marka (tylko dla towarów) |
| `items[].text` | string\|null | Tekst/opis pozycji |
| `items[].note` | string\|null | Powiązana notatka |
| `items[].qty` | number | Ilość pozycji |
| `items[].priceUnit` | number | Cena jednostkowa |
| `items[].priceTotal` | number | Cena całkowita |
| `items[].priceUnitIncVAT` | number | Cena jedn. brutto (z VAT) |
| `items[].priceTotalIncVAT` | number | Cena całk. brutto (z VAT) |
| `items[].vatRate` | number | Stawka VAT pozycji |
| `items[].intrastatCode` | string\|null | Kod Intrastat pozycji |
| `items[].deliveryNote` | string\|null | Powiązany numer WZ |
| `items[].invoice` | string\|null | Powiązany numer faktury |
| `items[].order` | string\|null | Powiązany numer zamówienia |
| `items[].unitWeightNetto` | number | Waga netto jedn. pozycji (kg) |
| **`headAddress`** | **object** | **Adres centrali** (ta sama struktura co `deliveryAddress`) |
| **`deliveryAddress`** | **object** | **Adres dostawy (oddziału)** |
| `deliveryAddress.id` | integer | Wewnętrzny ID adresu |
| `deliveryAddress.addressName` | string\|null | Nazwa adresu (tylko dla oddziałów) |
| `deliveryAddress.street` | string\|null | Ulica |
| `deliveryAddress.street2` | string\|null | Ulica 2 |
| `deliveryAddress.city` | string\|null | Miasto |
| `deliveryAddress.district` | string\|null | Powiat/dzielnica |
| `deliveryAddress.region` | string\|null | Region |
| `deliveryAddress.postalCode` | string\|null | Kod pocztowy |
| `deliveryAddress.country` | enum | Kod kraju (ISO – pełna lista w API) |
| `deliveryAddress.phone` | string\|null | Telefon |
| `deliveryAddress.mobil` | string\|null | Telefon komórkowy |
| `deliveryAddress.email` | string\|null | Email |
| `deliveryAddress.web` | string\|null | Strona www |
| `deliveryAddress.note` | string\|null | Notatka |
| `deliveryAddress.coordinates` | string\|null | Współrzędne geograficzne |
| `deliveryAddress.isValid` | boolean | Adres prawidłowo załadowany |
| `deliveryAddress.accessibleWarehouses` | array | Lista magazynów dostawcy dostępnych dla tokenu |
| `transportName` | string\|null | Nazwa transportu |

---

## 3.2 Get invoice file
```
POST /documents/invoice-file
```

Zwraca plik PDF faktury dla podanego numeru dokumentu.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `documentNumber` | string | TAK | Numer faktury, min 1 znak |

### Response 200

`Content-Type: application/pdf` → binarny plik PDF

---

## 3.3 Get invoices
```
POST /documents/invoices
```

Zwraca listę faktur w podanym zakresie dat.  
> Jeśli token należy do centrali: `loadAll = true` zwraca faktury dla wszystkich oddziałów.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `dateFrom` | date-time | TAK | Początek zakresu (zawsze **początek** dnia) |
| `dateTo` | date-time | TAK | Koniec zakresu (zawsze **koniec** dnia) |
| `loadAll` | boolean | nie | True = wszystkie oddziały (tylko dla centrali). Default: true |

### Response 200 – `DocumentListResponse`

Identyczna struktura jak w **3.1** – takie same pola `items[]`, `headAddress`, `deliveryAddress` itd.

---

---

# 4. ORDERS

---

## 4.1 Send order
```
POST /orders/sending
```

Wysyła zamówienie do systemu docelowego i zwraca potwierdzenie.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token, 1–40 znaków |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |
| `items` | array | TAK | Lista pozycji do zamówienia |
| `orderType` | enum | nie | `General` / `Warehouse` / `Fast` / `Personal` / `Manufacturer` |
| `searchTarget` | enum | nie | `CodeMain` / `CodeOE` / `CodeEAN` / `CodeInternal` / `InternalID` |
| `trySearchWithoutManufacturer` | boolean | nie | Szukaj bez producenta |
| `keepBackOrder` | boolean | nie | Default: **true** – zachowaj backorder jeśli towar niedostępny |
| `separatedDocument` | boolean | nie | Wymagaj osobnego dokumentu dla zamówienia |
| `waitNextOrder` | boolean | nie | Nie dostarczaj dopóki nie pojawi się kolejne zamówienie |
| `userNote` | string\|null | nie | Notatka użytkownika, max 600 znaków |
| `userOrder` | string\|null | nie | Własny numer zamówienia, max 75 znaków |
| `confirmOptionalPromotionItems` | boolean | nie | Potwierdź dodanie opcjonalnych pozycji promocyjnych |
| `subCustomerInfo` | object | nie | Dane podklienta |
| `optionalDeliveryAddress` | object | nie | Adres dostawy |

#### Struktura `items[]`

| Pole | Typ | Opis |
|------|-----|------|
| `prefix` | string | Prefix kodu |
| `code` | string | Kod pozycji |
| `brand` | string | Marka |
| `pairID` | integer | Własny ID pary |
| `internalID` | integer | Wewnętrzny ID |
| `qty` | number | Ilość do zamówienia |

#### Struktura `subCustomerInfo`

| Pole | Typ | Opis |
|------|-----|------|
| `name` | string\|null | Nazwa podklienta |
| `description` | string\|null | Opis |
| `street` | string\|null | Ulica |
| `city` | string\|null | Miasto |
| `postcode` | string\|null | Kod pocztowy |
| `countryCode` | string\|null | Kod kraju |
| `countryName` | string\|null | Nazwa kraju |
| `taxID` | string\|null | NIP/Tax ID |
| `vatID` | string\|null | VAT ID |
| `contactPhone` | string\|null | Telefon kontaktowy |
| `contactEmail` | string\|null | Email kontaktowy |

#### Struktura `optionalDeliveryAddress`

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Wewnętrzny ID adresu w systemie docelowym |
| `addressName` | string\|null | Nazwa adresu (tylko dla oddziałów) |
| `street` | string\|null | Ulica |
| `street2` | string\|null | Ulica 2 |
| `city` | string\|null | Miasto |
| `district` | string\|null | Powiat/dzielnica |
| `region` | string\|null | Region |
| `postalCode` | string\|null | Kod pocztowy |
| `country` | enum | Kod kraju (pełna lista ISO w API) |
| `phone` | string\|null | Telefon |
| `mobil` | string\|null | Telefon komórkowy |
| `email` | string\|null | Email |
| `web` | string\|null | Strona www |
| `note` | string\|null | Notatka |
| `coordinates` | string\|null | Współrzędne geograficzne |
| `isValid` | boolean | Adres prawidłowo załadowany |
| `accessibleWarehouses` | array | Lista dostępnych magazynów dostawcy |

### Response 200 – `OrderSendResponse`

| Pole | Typ | Opis |
|------|-----|------|
| `status` | enum | Status |
| `statusText` | string\|null | Opis |
| `duration` | integer | Czas (ms) |
| `items` | array | Lista wstawionych pozycji zamówienia |
| `orders` | array | Lista zamówień utworzonych w ramach requesta |
| `usedCustomOrderMode` | boolean | Czy użyto niestandardowego trybu zamówienia |

#### Struktura `items[].requestItem` (echo żądania)

| Pole | Typ | Opis |
|------|-----|------|
| `prefix` | string\|null | Prefix kodu |
| `code` | string\|null | Kod pozycji |
| `brand` | string\|null | Marka |
| `pairID` | integer | ID pary |
| `internalID` | integer | Wewnętrzny ID |
| `qty` | number | Żądana ilość |
| `info1` | string\|null | Info wewnętrzne 1 (max 45 znaków) |
| `info2` | string\|null | Info wewnętrzne 2 (max 45 znaków) |
| `info3` | string\|null | Info wewnętrzne 3 (max 45 znaków) |
| `searchedFor` | string\|null | Informacja o sposobie znalezienia pozycji (max 45 znaków) |
| `userNote` | string\|null | Notatka do pozycji zamówienia (max 400 znaków) |

#### Struktura `items[].catalogItem` – **dane produktu w zamówieniu**

*(Identyczna struktura jak `responseItem` w katalogach – patrz sekcja 1.1)*

Zawiera dodatkowo pola specyficzne dla zamówienia:

| Pole | Typ | Opis |
|------|-----|------|
| `qtyAvailable` | number | Dostępna ilość |
| `qtyCommited` | number | Zatwierdzona ilość (na podstawie ustawień backorder i dostępności) |
| `unitPriceCommited` | number | Zatwierdzona cena jedn. w walucie klienta |
| `totalPriceCommited` | number | Zatwierdzona cena całkowita w walucie klienta |

#### Struktura `items[].order` – **informacja o zamówieniu dla pozycji**

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Wewnętrzny ID zamówienia |
| `no` | string\|null | Numer zamówienia |
| `note` | string\|null | Notatka zamówienia |
| `status` | enum | `OrderedProperly` / `OrderedUncomplete` / `NotOrdered` / `NotFound` / `InvalidItem` / `none` |

#### Struktura `orders[]` – **lista zamówień**

Lista wszystkich zamówień utworzonych w ramach requesta (zwykle jedno; wyjątki: auto-split do oddziałów itp.)

### Przykład Request
```json
{
  "token": "ABC123TOKEN",
  "language": "pl",
  "items": [
    { "code": "BP980", "brand": "BOSCH", "qty": 2 }
  ],
  "orderType": "General",
  "searchTarget": "CodeMain",
  "keepBackOrder": true,
  "userOrder": "MO-2026-001",
  "userNote": "Zamówienie pilne"
}
```

---

## 4.2 Validate order
```
POST /orders/validation
```

Sprawdza ważność zamówienia **przed wysłaniem** – weryfikuje dostępność i poprawność danych.

### Request Body

Identyczne pola jak w **4.1 Send order** (cały request body taki sam).

### Response 200 – `OrderSendResponse`

Identyczna struktura jak w **4.1**.

---

---

# 5. PARTNERS

---

## 5.1 Get partner credit
```
POST /partners/credit
```

Zwraca informacje o limicie kredytowym i aktualnym stanie zadłużenia partnera.

### Request Body

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `token` | string | TAK | API token |
| `tokenIsMaster` | boolean | nie | Token master |
| `tokenPartnerID` | integer | nie | ID partnera |
| `language` | enum | TAK | Język |

### Response 200 – `PartnerCreditResponse`

| Pole | Typ | Opis |
|------|-----|------|
| `status` | enum | Status |
| `statusText` | string\|null | Opis |
| `duration` | integer | Czas (ms) |
| `limit` | number | Limit kredytowy (w skonfigurowanej walucie) |
| `limitOverdue` | number | Limit przeterminowany |
| `debts` | number | Aktualne zadłużenie |
| `debtsOverdue` | number | Zadłużenie przeterminowane |
| `debstDeliveryNotes` | number | Zadłużenie bez faktury (z WZ) |
| `countInvoiceOverdue` | integer | Liczba przeterminowanych faktur |
| `percentageDebts` | integer | Wykorzystanie kredytu (%) |
| `percentageDebtsOverdue