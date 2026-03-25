# Nextis ERP — Auto-Partner Flow z WolfParts (i dowolnego e-shopu)

## Opis problemu

Nextis API (`orders/sending`) wymaga `tokenPartnerID` — zamówienie musi iść na konto partnera. Nowy klient nie ma konta w ERP. Nextis API nie ma endpointu do tworzenia partnerów.

## Rozwiązanie

### Krok 1: E-shop wysyła zamówienie na konto "matki" (np. wolfparts = 884100)

```
POST {NEXTIS_API_URL}/orders/sending
{
  "token": "{ADMIN_TOKEN}",
  "tokenIsMaster": true,
  "tokenPartnerID": 884100,        ← konto WolfParts (matka)
  "language": "cs",
  "keepBackOrder": true,
  "userOrder": "WP-{timestamp}",    ← identyfikator (max 80 znaków)
  "userNote": "{JSON_KLIENTA}",     ← dane klienta (max 600 znaków, pole Poznamka)
  "subCustomerInfo": {              ← opcjonalnie, widoczne w ERP w "Další informace"
    "name": "Jan Novák",
    "street": "Ulice 123",
    "city": "Praha",
    "postcode": "11000",
    "countryCode": "CZ",
    "contactPhone": "+420777888999",
    "contactEmail": "jan@email.cz"
  },
  "items": [
    { "code": "GDB1330", "brand": "TRW", "qty": 1 }
  ]
}
```

### Format JSON w `userNote` (pole `Poznamka` w DB, max 600 znaków):

```json
{
  "n": "Jan Novák",           // jméno / název firmy (fakturační)
  "s": "Ulice 123",           // ulice
  "c": "Praha",               // město
  "z": "11000",               // PSČ
  "co": "CZ",                 // země
  "p": "+420777888999",       // telefon
  "e": "jan@email.cz",        // email (klíč pro identifikaci partnera)
  "dn": "Jan Novák",          // doručovací jméno (pokud jiný než fakturační)
  "ds": "Jiná ulice 5",       // doručovací ulice
  "dc": "Brno",               // doručovací město
  "dz": "60200"               // doručovací PSČ
}
```

Pokud `dn/ds/dc/dz` chybí → použije se fakturační adresa i pro doručení.

### Krok 2: SQL task v Nextis (co 1 minutu) — automatické zpracování

Nextis TSQL scheduler spouští každou minutu tento SQL. Ten:

1. **Najde** objednávky na kontu 884100 kde `Poznamka` začíná `{"n":"` a `Cislo_Objednavky_Odberatele` začíná `WP-`
2. **Parsuje** JSON z `Poznamka` (funkce `JSON_VALUE`, MSSQL 2016+)
3. **Hledá** existujícího partnera podle emailu (`EshopZak_RegEmail`)
4. **Vytvoří** nového partnera pokud neexistuje (INSERT do `SYSTEM_Kontakty` + `PARTNER_Settings`)
5. **Přepíše** objednávku na nového partnera (UPDATE `ID_Kontakt`, `ID_Objednatel`, `ID_Prijemce`)
6. **Aktualizuje** obě adresy — Odběratel (fakturační) i Příjemce (doručovací)
7. **Označí** jako zpracované: `WP-DONE-...` nebo `WP-ERR-...` při chybě

```sql
-- =============================================
-- WolfParts Auto-Partner Creator v2
-- Spouštět každou minutu přes Nextis TSQL scheduler
-- =============================================

DECLARE @OrderID INT, @Poznamka NVARCHAR(600), @UserOrder NVARCHAR(80)
DECLARE @Name NVARCHAR(100), @Street NVARCHAR(100), @City NVARCHAR(80)
DECLARE @Zip NVARCHAR(15), @Phone NVARCHAR(30), @Email NVARCHAR(100)
DECLARE @DName NVARCHAR(100), @DStreet NVARCHAR(100), @DCity NVARCHAR(80), @DZip NVARCHAR(15)
DECLARE @NewID INT, @ExistingID INT

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
  SELECT ID, Poznamka, Cislo_Objednavky_Odberatele
  FROM OBJEDNAVKY
  WHERE ID_Kontakt = 884100
    AND Poznamka LIKE '{"n":"%'
    AND Cislo_Objednavky_Odberatele LIKE 'WP-%'
    AND Cislo_Objednavky_Odberatele NOT LIKE 'WP-DONE-%'
    AND Cislo_Objednavky_Odberatele NOT LIKE 'WP-ERR-%'

OPEN cur
FETCH NEXT FROM cur INTO @OrderID, @Poznamka, @UserOrder

WHILE @@FETCH_STATUS = 0
BEGIN
  BEGIN TRY
    -- Parsuj JSON z Poznamka
    SET @Name = JSON_VALUE(@Poznamka, '$.n')
    SET @Street = JSON_VALUE(@Poznamka, '$.s')
    SET @City = JSON_VALUE(@Poznamka, '$.c')
    SET @Zip = JSON_VALUE(@Poznamka, '$.z')
    SET @Phone = JSON_VALUE(@Poznamka, '$.p')
    SET @Email = JSON_VALUE(@Poznamka, '$.e')

    -- Doručovací adresa (pokud chybí = stejná jako fakturační)
    SET @DName = ISNULL(JSON_VALUE(@Poznamka, '$.dn'), @Name)
    SET @DStreet = ISNULL(JSON_VALUE(@Poznamka, '$.ds'), @Street)
    SET @DCity = ISNULL(JSON_VALUE(@Poznamka, '$.dc'), @City)
    SET @DZip = ISNULL(JSON_VALUE(@Poznamka, '$.dz'), @Zip)

    -- Existuje partner s tímto emailem?
    SET @ExistingID = NULL
    SELECT TOP 1 @ExistingID = ID FROM SYSTEM_Kontakty
    WHERE EshopZak_RegEmail = @Email AND Archivace = 0

    -- Vytvoř nového partnera pokud neexistuje
    IF @ExistingID IS NULL
    BEGIN
      SET @NewID = (SELECT MAX(ID) + 1 FROM SYSTEM_Kontakty)

      INSERT INTO SYSTEM_Kontakty (
        ID, GUID, TypKontaktu, Je_Provozovna, ID_Centraly, ID_Materska,
        ID_FormularPrijmu, ID_TypFakturace, ID_Zavedl, ID_Mena,
        DatumZavedeni, Datum_Zavedeni,
        ZaraditJako, NazevFirmy, Ulice, PSC, Mesto, Stat,
        PlatceDPH, JeOdberatel, JeDodavatel,
        EshopZak_Login, EshopZak_Heslo, EshopZak_RegEmail,
        EshopZak_emailSend, Eshop_IDStredisko, Eshop_IDSklad, Eshop_IDProvozovna,
        Archivace, CenovaSkupina, Price_GlobalPricing,
        WsExportInvoices, WsExportDeliveryNotes, WsImportOrders,
        Eshop_ExpandMarks, Eshop_DefViewAllManu, Eshop_ConfirmTradingTerms,
        Orders_StoreBO, Poznamka_1
      )
      VALUES (
        @NewID, NEWID(), 0, 0, @NewID, -1,
        -1, -1, 45, 144,
        GETDATE(), GETDATE(),
        LEFT(@Name, 30), @Name, @Street, @Zip, @City, 15797,
        0, 1, 0,
        @Email, LEFT(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 12), @Email,
        0, 1, 1, 1,
        0, 0, 1,
        1, 1, 1,
        0, 0, 0,
        1, 'WolfParts auto-registrace'
      )

      INSERT INTO PARTNER_Settings (SET_ID, PARTNER_ID, LANG_ID, DESCR, VAL_I, VAL_N) VALUES
      (200400, @NewID, -1, '', -1, ''),
      (10099001, @NewID, -1, '', 1, '{"Status": 1}'),
      (10099002, @NewID, -1, '', 1, '{"LabourTimes":false,"Maintenance":false,"Adjustment":false,"Wiring":false,"WiringComfort":false,"Diagnostics":false,"Fuses":false,"Graphics":false,"Manuals":false,"Tyres":false,"LicenceID":"","Status":1}'),
      (10099003, @NewID, -1, '', 1, '{"Status": 1}'),
      (10099004, @NewID, -1, '', 1, '{"Status": 1}'),
      (10099005, @NewID, -1, '', -1, '{"NumberPlateSearch":false,"NumberPlateLimitPerMonth":50,"Status":-1}'),
      (20040009, @NewID, -1, '', -1, ''),
      (30001001, @NewID, -1, '', -3, '')
    END
    ELSE
    BEGIN
      SET @NewID = @ExistingID
    END

    -- Přepiš objednávku na nového partnera + oba adresy
    UPDATE OBJEDNAVKY SET
      ID_Kontakt = @NewID,
      ID_Objednatel = @NewID,
      ID_Prijemce = @NewID,
      -- Fakturační (Odběratel)
      Adresa_ODB_Nazev = @Name,
      Adresa_ODB_Ulice = @Street,
      Adresa_ODB_Mesto = @City,
      Adresa_ODB_PSC = @Zip,
      ODB_Telefon = @Phone,
      ODB_Email = @Email,
      -- Doručovací (Příjemce)
      Adresa_PRJ_Nazev = @DName,
      Adresa_PRJ_Ulice = @DStreet,
      Adresa_PRJ_Mesto = @DCity,
      Adresa_PRJ_PSC = @DZip,
      PRJ_Telefon = @Phone,
      PRJ_Email = @Email,
      -- Označ jako zpracované
      Cislo_Objednavky_Odberatele = 'WP-DONE-' + SUBSTRING(@UserOrder, 4, 77)
    WHERE ID = @OrderID

  END TRY
  BEGIN CATCH
    UPDATE OBJEDNAVKY SET
      Cislo_Objednavky_Odberatele = 'WP-ERR-' + SUBSTRING(@UserOrder, 4, 77)
    WHERE ID = @OrderID
  END CATCH

  FETCH NEXT FROM cur INTO @OrderID, @Poznamka, @UserOrder
END

CLOSE cur
DEALLOCATE cur
```

## Klíčové tabulky v Nextis DB

| Tabulka | Účel |
|---------|------|
| `SYSTEM_Kontakty` | Hlavní tabulka partnerů (zákazníků) |
| `PARTNER_Settings` | Nastavení partnera (cenníky, TecDoc, atd.) |
| `OBJEDNAVKY` | Objednávky — hlavička |
| `OBJEDNAVKY_Polozky` | Položky objednávek |
| `PARTNER_Addresses` | Dodací adresy partnerů |
| `API_GetCustomers` | VIEW — čtení partnerů (read-only) |
| `API_GetOrders` | VIEW — čtení objednávek (read-only) |

## Mapování polí (API → DB)

| API pole | DB pole (`SYSTEM_Kontakty`) | DB pole (`OBJEDNAVKY`) |
|----------|---------------------------|----------------------|
| name | `NazevFirmy`, `ZaraditJako` | `Adresa_ODB_Nazev`, `Adresa_PRJ_Nazev` |
| street | `Ulice` | `Adresa_ODB_Ulice`, `Adresa_PRJ_Ulice` |
| city | `Mesto` | `Adresa_ODB_Mesto`, `Adresa_PRJ_Mesto` |
| postcode | `PSC` | `Adresa_ODB_PSC`, `Adresa_PRJ_PSC` |
| phone | — | `ODB_Telefon`, `PRJ_Telefon` |
| email | `EshopZak_Login`, `EshopZak_RegEmail` | `ODB_Email`, `PRJ_Email` |
| heslo | `EshopZak_Heslo` (auto-generated) | — |

## Mapování polí (API → DB objednávky)

| API pole | DB pole |
|----------|---------|
| `userOrder` | `Cislo_Objednavky_Odberatele` (max 80 znaků) |
| `userNote` | `Poznamka` (max 600 znaků) |
| `items[].userNote` | `OBJEDNAVKY_Polozky.Poznamka` |
| `tokenPartnerID` | `ID_Kontakt` |

## Důležité konstanty

| Konstanta | Hodnota | Význam |
|-----------|---------|--------|
| `ID_Mena = 144` | CZK | Česká koruna |
| `Stat = 15797` | CZ | Česká republika |
| `ID_Zavedl = 45` | — | Kdo vytvořil (systém) |
| `Price_GlobalPricing = 1` | — | Globální ceník (nutné pro zobrazení cen!) |
| `Eshop_IDStredisko = 1` | Bohumín | Středisko |
| `Eshop_IDSklad = 1` | Bohumín | Sklad |
| `Eshop_IDProvozovna = 1` | Bohumín | Provozovna |

## Bezpečnostní mechanismy

1. **`WP-DONE-`** prefix — zpracované objednávky se znovu nezpracují
2. **`WP-ERR-`** prefix — při chybě se objednávka označí, nezůstane ve smyčce
3. **`BEGIN TRY/CATCH`** — chyba u jedné objednávky nezastaví zpracování ostatních
4. **Email deduplication** — pokud partner s daným emailem existuje, použije se existující (ne duplicita)
5. **Objednávka vždy existuje** — i při chybě zůstane na kontu 884100 s daty v Poznamka

## Jak přidat do nového projektu

1. Vytvořte "mateřské" konto v Nextis (jako wolfparts = 884100)
2. V `.env` nastavte:
   ```
   NEXTIS_API_URL=https://api.VASE_INSTANCE.nextis.cz
   NEXTIS_TOKEN_ADMIN=VAS_MASTER_TOKEN
   NEXTIS_DEFAULT_PARTNER_ID=ID_MATEŘSKÉHO_KONTA
   ```
3. Při odesílání objednávky: `tokenPartnerID` = mateřské konto, `userNote` = JSON zákazníka
4. V Nextis nastavte TSQL task co 1 minutu s upraveným SQL (změňte `884100` na vaše ID)
5. Hotovo — objednávky se automaticky přepisují na nové zákazníky

## Testování

```bash
# Odeslat testovací objednávku
curl -X POST {API_URL}/orders/sending \
  -H "Content-Type: application/json" \
  -d '{
    "token": "{ADMIN_TOKEN}",
    "tokenIsMaster": true,
    "tokenPartnerID": 884100,
    "language": "cs",
    "keepBackOrder": true,
    "userOrder": "WP-TEST-001",
    "userNote": "{\"n\":\"Test\",\"s\":\"Ulice 1\",\"c\":\"Praha\",\"z\":\"11000\",\"co\":\"CZ\",\"p\":\"+420111\",\"e\":\"test@test.cz\"}",
    "items": [{"code": "GDB1330", "brand": "TRW", "qty": 1}]
  }'
```

```sql
-- Kontrola nezpracovaných objednávek
SELECT ID, Cislo_Objednavky_Odberatele, Poznamka
FROM OBJEDNAVKY
WHERE ID_Kontakt = 884100
  AND Poznamka LIKE '{"n":"%'
  AND Cislo_Objednavky_Odberatele LIKE 'WP-%'
  AND Cislo_Objednavky_Odberatele NOT LIKE 'WP-DONE-%'

-- Kontrola zpracovaných
SELECT TOP 10 ID, Cislo_Objednavky_Odberatele, ID_Kontakt
FROM OBJEDNAVKY
WHERE Cislo_Objednavky_Odberatele LIKE 'WP-DONE-%'
ORDER BY ID DESC

-- Kontrola chyb
SELECT ID, Cislo_Objednavky_Odberatele, Poznamka
FROM OBJEDNAVKY
WHERE Cislo_Objednavky_Odberatele LIKE 'WP-ERR-%'
```
