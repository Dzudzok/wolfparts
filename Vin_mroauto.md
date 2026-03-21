# VIN Search Widget – mlpVehicleSearch

## Jak działa wyszukiwanie VIN na mroauto.cz

### Źródła kodu
- **Injector:** `https://dzudzok.github.io/mroauto-custom/injector.js`
- **Global boot (główna logika VIN):** `https://dzudzok.github.io/mroauto-custom/global.js`
- **Homepage VIN injector:** `https://dzudzok.github.io/mroauto-custom/HomePage/homepage.js`
- Oba pliki (global.js + homepage.js) zawierają **identyczną logikę VIN** — homepage.js jest wersją tylko dla `/cs`, global.js bootuje na każdej stronie ale też sprawdza `isHomeCS()`.

---

## Architektura działania

### 1. Kontrola dostępu (gating)
```js
const REQUIRE_LOGIN = true;   // tylko zalogowani
const REQUIRE_B2B   = true;   // tylko klienci B2B
const REQUIRE_FULL  = true;   // wymaga dokładnie 17 znaków VIN
```

Sprawdzenie loginu:
```js
function isLoggedIn() {
  const userMenu = document.querySelector('#ctl00\\$ctl00\\$BodyContentPlaceHolder\\$UserMenu .customer-name');
  const loginForm = document.getElementById('ctl00$ctl00$BodyContentPlaceHolder$LoginForm');
  if (userMenu) return true;
  if (loginForm && !userMenu) return false;
  return !!userMenu;
}
```

Sprawdzenie B2B (multi-signal):
```js
function isB2B() {
  // 1. window.__MRO_IS_B2B
  // 2. .customer .id lub .customer .name w UserMenu
  // 3. nazwa firmy uppercase lub z sufiksem s.r.o./a.s./GmbH itd.
  // 4. IČ/IČO/DIČ w tekście
  // 5. cookie customerType=B2B
  // 6. [data-customer-type="b2b"] lub .user-is-b2b
  // 7. window.nextisUser.isB2B
}
```

---

### 2. Budowa DOM (`buildHost()`)

Widget tworzy element `<div id="mlpVehicleSearch">` i wstrzykuje go do layoutu.
```html
<div id="mlpVehicleSearch">
  <div class="vehicleSearch">
    <nav class="vehicleSearch__wrapper">
      <h4 class="vehicleSearch__heading">Vyhledejte váš vůz podle VIN</h4>
      <form class="vehicleSearch__form --active" novalidate>
        <label class="vehicleSearch__label">
          <!-- 17x kratki-komorek -->
          <span class="vehicleSearch__char"></span>  <!-- x17 -->
          <input type="text" inputmode="latin" autocomplete="off"
                 minlength="17" maxlength="17"
                 class="vehicleSearch__input" aria-label="VIN (17 znaků)">
          <div class="vehicleSearch__charCounter --active">0/17</div>
        </label>
        <button class="vehicleSearch__btn" type="submit" disabled>
          <!-- ikona lupy SVG -->
        </button>
      </form>
      <!-- jeśli !allowed: overlay z kłódką i linkiem do logowania -->
    </nav>
  </div>
</div>
```

---

### 3. Umieszczenie w layoucie (`placeHost()`)
```js
function placeHost(host) {
  const menu = document.querySelector('.flex-menu.flex-menu-items-5, .flex-menu-items-5, .flex-main-menu .flex-menu');
  const side = document.querySelector('.side-container.left, .side-container.left-column, .side-container.leftcol');
  // Wstawia: przed side-container (lewy pasek) lub po menu
  parent.insertBefore(host, before || null);
}
```

**Boot sequence:**
1. Czeka na `.flex-main-menu .flex-menu` (timeout 3s)
2. Czeka na `.side-container.left` (timeout 3s)
3. Sprawdza czy `#mlpVehicleSearch` już istnieje (guard)
4. Wstawia widget

---

### 4. Logika inputu (`wire()`)

#### Sanityzacja VIN:
```js
function sanitize(v) {
  return (v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')   // tylko litery i cyfry
    .replace(/[IOQ]/g, '')        // I, O, Q niedozwolone w VIN
    .slice(0, 17);
}
```

#### Render kratki (desktop):
```js
cells.forEach((cell, i) => {
  cell.textContent = i < chars.length ? chars[i] : '';
  cell.classList.toggle('--filled', i < chars.length); // zielona ramka
});
// Animowany kursor (caret) na aktualnej pozycji
const caretIdx = Math.min(chars.length, 16);
const caret = document.createElement('span');
caret.className = 'vehicleSearch__carret'; // miga @keyframes mroBlink
cells[caretIdx].appendChild(caret);
// Licznik: "12/17"
counter.textContent = `${chars.length}/17`;
```

#### Mobile (≤540px):
- Kratki ukryte (`display:none!important`)
- Input staje się widoczny (`position:static; opacity:1`)
- Przycisk full-width

#### Aktywacja przycisku:
```js
btn.disabled = allowed ? (chars.length !== 17) : true;
//             ^B2B+login  ^dokładnie 17 znaków
```

#### Zdarzenia:
```js
input.addEventListener('input', () => {
  input.value = sanitize(input.value);
  render(input.value);
});

input.addEventListener('paste', (e) => {
  e.preventDefault();
  const t = e.clipboardData?.getData('text') || '';
  input.value = sanitize(t);
  render(input.value);
});
```

---

### 5. Submit → Redirect
```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!allowed) return;
  const vin = sanitize(input.value);
  if (vin.length !== 17) return input.focus();
  location.href = REDIRECT(vin);
});

// URL pattern:
const REDIRECT = vin => 'https://www.mroauto.cz/cs/katalog/yq-katalog/vin/' + encodeURIComponent(vin);
```

**Przykład:**
```
VIN: TMBHG41U842869463
→ https://www.mroauto.cz/cs/katalog/yq-katalog/vin/TMBHG41U842869463
```

---

### 6. Strona wynikowa YQ-katalog

URL pattern: `/cs/katalog/yq-katalog/vin/{VIN}`

Platforma: **Nextis Eshop + Laximo/YQ katalog** (zewnętrzna baza pojazdów)

DOM wynikowy:
```
.flex-laximo
  └─ .flex-laximo-vehicles
       └─ #ctl00$ctl00$BodyContentPlaceHolder$ContentCPH$YqVehicles
            ├─ .flex-header
            │    ├─ .flex-title  → "Vyberte si vozidlo"
            │    └─ .flex-search (input filtr)
            └─ .flex-vehicles-list
                 └─ .flex-item-container
                      ├─ .flex-title (nagłówki kolumn)
                      └─ .vehicle-container
                           └─ a.flex-item[href="/cs/katalog/yq-katalog/vozidlo/{make}/{catalogId}/{idx}?ssd=..."]
                                ├─ span.flex-name          → "SKODA"
                                ├─ span.flex-model         → "Octavia"
                                ├─ span.flex-engine        → "1900CC / 90hp / 66kW TDI"
                                ├─ span.flex-engine-code   → "ALH"
                                ├─ span.flex-vehicle-date  → "2001 - 2011"
                                ├─ span.flex-interior-color→ (napęd/kolor wnętrza)
                                ├─ span.flex-gearbox       → "EGR(5S)"
                                └─ span.flex-color         → "U9U9"
```

**Test VIN: `TMBHG41U842869463`**
```
Marka:       SKODA
Model:       Octavia
Silnik:      1900CC / 90hp / 66kW TDI
Kod silnika: ALH
Rocznik:     2001 - 2011
Skrzynia:    EGR(5S)
Kolor:       U9U9
```

Link do katalogu części:
```
/cs/katalog/yq-katalog/vozidlo/skoda/YQSE9/0?ssd={encoded_ssd}
```

---

## CSS – kluczowe klasy

| Klasa | Opis |
|---|---|
| `#mlpVehicleSearch` | Root widget, `max-width:1210px` |
| `.vehicleSearch__heading` | Tytuł sekcji, niebieski `#0b3b82` |
| `.vehicleSearch__form` | Grid: `1fr auto`, gap 10px |
| `.vehicleSearch__label` | Kontener 17 kratek + input |
| `.vehicleSearch__char` | Kratka 36×44px (desktop) / ukryta (mobile) |
| `.vehicleSearch__char.--filled` | Wypełniona kratka – zielona ramka `#4CAF50` |
| `.vehicleSearch__carret` | Migający kursor (animacja `mroBlink`) |
| `.vehicleSearch__input` | `position:absolute; opacity:0` (nakładka na kratki) |
| `.vehicleSearch__btn` | Przycisk szukaj (disabled gdy <17 znaków) |
| `.vehicleSearch__charCounter` | Licznik `X/17` |
| `#mlpVehicleSearch.--locked` | Blur + overlay gdy B2B/login wymagane |
| `.vehicleSearch__overlay` | Nakładka blokująca z linkiem do logowania |

---

## Reproduction checklist – co odwzorować na innej stronie

1. **Gate check:** sprawdź login + B2B (lub wyłącz `REQUIRE_LOGIN=false`, `REQUIRE_B2B=false`)
2. **Build DOM:** 17 kratek `<span>` + hidden input + button disabled
3. **Sanitize:** uppercase, tylko `[A-Z0-9]`, bez `I/O/Q`, max 17 znaków
4. **Render:** wypełnij kratki, animuj kursor, aktualizuj licznik
5. **Paste handler:** `e.preventDefault()` + sanitize z clipboard
6. **Mobile breakpoint ≤540px:** ukryj kratki, pokaż plain input
7. **Submit:** redirect do `/yq-katalog/vin/{VIN}` (lub endpoint własny)
8. **Locked overlay:** gdy user nie ma dostępu – blur 1.2px + overlay z CTA
9. **Boot guards:**
   - `isHomeCS()` – tylko na homepage
   - sprawdź `document.getElementById('mlpVehicleSearch')` przed wstawieniem
   - `MutationObserver` watchdog – remount jeśli Nextis usunie widget
10. **ASP.NET UpdatePanel:** `Sys.WebForms.PageRequestManager` → `add_endRequest → mountVIN()`




markdown# YQ-Katalog – Kategorie, Zdjęcia Aktywne i Wyszukiwanie Produktów

## Kompletny przepływ po wyborze pojazdu z VIN
```
VIN → /yq-katalog/vin/{VIN}
  └─ wybór pojazdu (flex-item) → /yq-katalog/vozidlo/{make}/{catalogId}/{idx}?ssd=...&vin=...
       └─ wybór kategorii (STROMOVÉ / OBRÁZKOVÉ)
            └─ wybór skupiny → /yq-katalog/skupiny/{make}/{slug}/{catalogId}/{idx}/{groupId}?ssd=...
            └─ wybór jednotky → /yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}?ssd=...&img=...&note=...
                 └─ wybór OE + "Zobrazit vybrané díly"
                      └─ lista produktów → /yq-katalog/dily/{oe}/{catalogId}/{idx}/{unitId}?ssd=...
```

---

## Strona VOZIDLO – wybór kategorii

### URL pattern:
```
/cs/katalog/yq-katalog/vozidlo/{make}/{catalogId}/{idx}
  ?ssd={session_token}
  &vin={vin}
```
Przykład:
```
/cs/katalog/yq-katalog/vozidlo/skoda/YQSE9/0?ssd=$*Kw...&vin=TMBHG41U842869463
```

### DOM struktura:
```
.flex-laximo
  └─ .flex-laximo-vehicle-detail  (id: ctl00$...$YqVehicleDetail)
       ├─ .flex-header
       │    └─ span.flex-title  → "Zvolte si kategorii"
       ├─ .flex-tabs
       │    ├─ a#PicturesViewTabButton   → "Obrázkové zobrazení"
       │    │   href="javascript:getYqVehicleDetail('.flex-content-list', 0, '{catalogId}', '{make}', {idx}, '{ssd}')"
       │    └─ a#TreeViewTabButton.flex-selected → "Stromové zobrazení"
       │        href="javascript:getYqVehicleDetail('.flex-content-list', 1, ...)"
       └─ .flex-content-list
            └─ [AJAX] przeładowywana treść
```

---

## STROMOVÉ ZOBRAZENÍ – drzewo kategorii

### Funkcja JS:
```js
getYqVehicleDetail('.flex-content-list', 1, 'YQSE9', 'skoda', 0, '{ssd}')
// parametr 1 = stromové, 0 = obrázkové
```

### DOM drzewa:
```
.flex-content-list
  └─ .tree-view-list
       └─ .tree
            └─ .node
                 ├─ a[href="javascript:void(0)"]  → kategoria grupująca (bez linku)
                 └─ .node
                      ├─ a[href="javascript:void(0)"]  → podkategoria grupująca
                      └─ .node
                           └─ a[href="/cs/katalog/yq-katalog/skupiny/{make}/{slug}/{catalogId}/{idx}/{groupId}?ssd=..."]
                                → liść = klikalna kategoria
```

### URL pattern liścia:
```
/cs/katalog/yq-katalog/skupiny/{make}/{slug}/{catalogId}/{idx}/{groupId}?ssd={ssd}
```
Przykłady:
```
/cs/katalog/yq-katalog/skupiny/skoda/olejovy-filtr/YQSE9/0/10359?ssd=...
/cs/katalog/yq-katalog/skupiny/skoda/palivovy-filtr/YQSE9/0/10361?ssd=...
/cs/katalog/yq-katalog/skupiny/skoda/vzduchovy-filtr/YQSE9/0/10360?ssd=...
```

### Struktura kategorii (Filtr):
```
Filtr                           ← void(0), grupująca
├─ Olejovy filtr                → /skupiny/.../10359
├─ Vzduchovy filtr              → /skupiny/.../10360
├─ Palivový filtr               → /skupiny/.../10361
└─ Kabinovy filtr               → /skupiny/.../10363
```

---

## OBRÁZKOVÉ ZOBRAZENÍ – kafelki ze zdjęciami

### Funkcja JS:
```js
getYqVehicleDetail('.flex-content-list', 0, 'YQSE9', 'skoda', 0, '{ssd}')
// 0 = obrázkové (kafelki)
```

### DOM kafelki:
```
.flex-content-list
  └─ .flex-groups-container
       ├─ .flex-pictures-view-list
       │    └─ a[href="/cs/katalog/yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}?ssd=..."]
       │         ├─ img[alt="{nazwa}", src="{url_obrazka}"]    ← rysunek kategorii
       │         ├─ span.flex-name  → "{kod} {nazwa pełna}"
       │         └─ span.flex-code  → "{kod}"   np. "100-010", "103-015"
       └─ .flex-nodes
            └─ .flex-tree[@data-flex-dynamic="true"]
                 └─ a.flex-node[href="javascript:getYqPicturesUnits('.flex-pictures-view-list', {nodeId}, 0, '{make}', '{catalogId}', '{ssd}')"]
                      └─ span → "motor" / "karoserie" / "kola, brzdy" itd.
```

### Sidebar kategorii (prawy panel):
```js
// Klik w węzeł → AJAX przeładowuje .flex-pictures-view-list
getYqPicturesUnits('.flex-pictures-view-list', 1, 0, 'skoda', 'YQSE9', '{ssd}')
// nodeId: 1=motor, 2=palivo/chlazeni, 3=prevodovka, 4=predni naprava,
//         5=zadni naprava, 6=kola/brzdy, 7=pakove ustroji, 8=karoserie,
//         9=elektrika, 0=prislusenstvi
```

### URL kafelka → jednotka:
```
/cs/katalog/yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}
  ?ssd={ssd}
  &img={url_obrazka_encoded}
  &note={nota_encoded}
```
Przykład:
```
/cs/katalog/yq-katalog/jednotka/skoda/olej-motorovy/YQSE9/0/8526847
  ?ssd=...
  &img=https%3a%2f%2fimg.altechopersys.com%2fYQSE9%2fsource%2f460%2f...gif
  &note=olej+motorovy%3b%3bm-c46-zazehovy
```

---

## Strona SKUPINY – rysunek + lista OE (filtr olejowy)

### URL:
```
/cs/katalog/yq-katalog/skupiny/{make}/{slug}/{catalogId}/{idx}/{groupId}?ssd=...
```

### DOM:
```
.flex-laximo
  └─ .yq-group  (id: ctl00$...$YqGroup1)
       ├─ .header → span.title "Zvolte si kategorii"
       └─ .group-list
            ├─ a.title[href="/cs/katalog/yq-katalog/vozidlo/{make}/{catalogId}/{idx}/{nodeId}?ssd=..."]
            │    → link powrotny do kategorii (np. "motor")
            ├─ .image
            │    └─ a[href="/cs/katalog/yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}?ssd=..."]
            │         ├─ img[alt="{nazwa}", src="{url_tech_drawing}"]   ← RYSUNEK TECHNICZNY
            │         └─ span → "{nazwa}"
            └─ .oes
                 ├─ .header
                 │    ├─ span.number → "Číslo"
                 │    ├─ span.oe     → "OE"
                 │    └─ span.name   → "Název"
                 └─ a[href="/cs/katalog/yq-katalog/dily/{oe_slug}/{catalogId}/{idx}/{unitId}?ssd=..."]
                      ├─ span.number → "1" (numer pozycji na rysunku)
                      ├─ span.oe     → "038115389D" (numer OE)
                      └─ span.name   → "Držák olejového filtru"
```

### URL pattern linku OE:
```
/cs/katalog/yq-katalog/dily/{oe_lowercase_slug}/{catalogId}/{idx}/{unitId}?ssd=...
```
Przykłady:
```
/cs/katalog/yq-katalog/dily/038115389d/YQSE9/0/8528456?ssd=...
/cs/katalog/yq-katalog/dily/038115433/YQSE9/0/8528456?ssd=...
/cs/katalog/yq-katalog/dily/n-90782301/YQSE9/0/8528456?ssd=...
```

---

## Strona JEDNOTKA – interaktywny rysunek + checkboxy OE

### URL:
```
/cs/katalog/yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}
  ?ssd=...&img={url_obrazka}&note={nota}
```

### DOM:
```
.flex-laximo
  └─ .flex-laximo-unit  (id: ctl00$...$YqUnit)
       ├─ .flex-header
       │    ├─ span.flex-title → "Zvolte si jednotku"
       │    └─ div.title-note  → "olej motorovy;;m.zazehovy---"
       └─ .flex-oe-list
            ├─ .ImagePart                    ← LEWA KOLUMNA - rysunek
            │    └─ .advanced-image-viewer
            │         ├─ .viewport
            │         │    └─ .scale-wrapper
            │         │         ├─ img[src="{url_rysunku}"]   ← ZDJĘCIE TECHNICZNE
            │         │         └─ div.area[id="Area_{num}"]  ← HOTSPOTY (klikalne obszary)
            │         │              [onclick="selectYqPart('{num}');"]
            │         │              [style="top: {y}px; left: {x}px; width: {w}px; height: {h}px;"]
            │         ├─ .ControlsInOut     ← przyciski zoom +/-
            │         ├─ .ControlsFitIn     ← fullscreen/dopasuj
            │         └─ .Help              → "Zvětšování obrázku pomocí kolečka myši..."
            └─ .flex-oe-part                ← PRAWA KOLUMNA - lista OE
                 └─ .flex-oe-part-table
                      ├─ .flex-title
                      │    ├─ span.oe    → "OE"
                      │    └─ span.name  → "Název"
                      └─ div.flex-item[id="OEItem_{sortNum}_{posNum}"]  ← wiersz OE
                           [@data-flex-oe="{oe_value}"]        np. "G++052195M2"
                           [@data-flex-image-code="{num}"]     numer na rysunku
                           [@data-flex-sort-number="{int}"]    kolejność
                           ├─ span.flex-number  → "1" (numer pozycji)
                           ├─ span.flex-oe      → "G  052195M2"
                           ├─ span.flex-name    → "Olej motorovy 'LongLife'"
                           └─ div.note → span.note-text → "...3. GENERACE;1,0 litr;5W-30..."
```

### Klik w wiersz OE → `selectYqPart('{num}')`:
- Zaznacza wiersz (podświetlenie)
- Synchronizuje hotspot na rysunku
- Aktualizuje `.flex-confirmation`:
```
.flex-confirmation
  ├─ span → span.flex-selected-items-count → "1"  (liczba wybranych)
  ├─ div.flex-selected-items-oes → "G  052195M2"
  └─ input.flex-button[type=button, value="Zobrazit vybrané díly"]
       [onclick="navigateToYqParts('cs','katalog','yq-katalog','dily',
         '{catalogId}','{idx}',{unitId},'{ssd}')"]
```

### Przekierowanie po kliknięciu "Zobrazit vybrané díly":
```
navigateToYqParts('cs','katalog','yq-katalog','dily','YQSE9','0',8526847,'{ssd}')
→ /cs/katalog/yq-katalog/dily/{selected_oes}/{catalogId}/{idx}/{unitId}?ssd=...
```
Wiele wybranych OE → URL: `/dily/OE1++OE2++OE3/...`

---

## Strona DILY – lista produktów z filtrami

### URL:
```
/cs/katalog/yq-katalog/dily/{oe}/{catalogId}/{idx}/{unitId}?ssd=...
```
Przykład:
```
/cs/katalog/yq-katalog/dily/G++052195M2/YQSE9/0/8526847?ssd=...
```

### Kontener główny:
```
div.products  (id: ctl00$...$Products2)
  ├─ [hidden inputs – state]
  │    ├─ RefreshProductsState="true"
  │    ├─ CurrentPage="1"
  │    ├─ PageScrollTop="0"
  │    ├─ ViewMode="0"          (0=katalog, 1=lista)
  │    ├─ CatalogType="Yq"
  │    ├─ CurrentOE=""
  │    ├─ SelectedPartGroupID=""
  │    └─ AreHiddenGroupsVisible="false"
  ├─ .flex-filter
  │    ├─ .flex-general
  │    │    ├─ .flex-sorting-container
  │    │    │    └─ select#Products2_SortMethod.flex-drop-down
  │    │    │         [onchange="getYqProducts('.products-list', val, onStock, purchPrice, viewMode, currentOE, '{oe}', '{catalogId}', {idx}, {unitId}, '{ssd}', true, hiddenGroups, false, 1, true, '', event)"]
  │    │    │         options: 0=Výchozí, 1=Kód, 2=Výrobce, 3=Název, 4=Skladem,
  │    │    │                  5=Dostupnost+cena↑, 6=Cena↑, 7=Cena↓
  │    │    ├─ label + input#OnStockOnly[checkbox]  → "Pouze skladem"
  │    │    └─ .flex-view-modes
  │    │         ├─ input#ProductViewMode_0[onclick="getYqProducts(..., 0, ...)"]  ← KATALOG (kafelki)
  │    │         └─ input#ProductViewMode_1[onclick="getYqProducts(..., 1, ...)"]  ← LISTA
  │    └─ .flex-extended.other-parameters
  │         ├─ .flex-manufacturers
  │         │    ├─ div.flex-title → "Výrobci"
  │         │    └─ .flex-content → .flex-values
  │         │         └─ [per producent]
  │         │              ├─ label.flex-checkbox-common → input.flex-checkbox
  │         │              └─ span#ManufacturerFilter_oe_{n}_FlexCheckboxToogleText
  │         │                   → "FEBI BILSTEIN (3)" / "SCT-MANNOL (2)"
  │         └─ .flex-filter-params / .flex-parameters-filter  ← filtry parametrów
  ├─ .flex-laximo-oe-groups                ← czerwony pasek z OE
  │    └─ .flex-item.flex-selected
  │         ├─ span.flex-toogle-icon
  │         ├─ span.flex-oe → "OE číslo G  052195M2"
  │         ├─ span.flex-name → "Motorový olej"
  │         └─ span.flex-count → "Nalezeno 7"
  └─ .products-list.catalog-view          ← lista produktów (AJAX)
       └─ div#ProductItem_{groupId}[...]   ← PRODUKT
```

---

## Struktura produktu `#ProductItem_{groupId}`

### Data atrybuty:
```html

```

### Zawartość:
```
.flex-col1                          ← LEWA (zdjęcie)
  └─ .flex-image-wrapper
       └─ a[href="/cs/katalog/yq-katalog/dily/{oe}/{slug}/{catalogId}/{idx}/{unitId}/{groupId}?ssd=..."]
            └─ img[src="{tecalliance_cdn_url}", alt="{nazwa}"]
               ← URL: https://digital-assets.tecalliance.services/images/3200/{hash}.jpg

.flex-col2                          ← PRAWA (szczegóły)
  └─ .flex-header-container.processed
       ├─ .manufacturer-code → "FEBI BILSTEIN 32945"
       ├─ .manufacturer-logo → img[src="{logo_url}"]
       ├─ .manufacturer → "FEBI BILSTEIN"
       ├─ .code → "32945"
       ├─ .flex-product-flags
       ├─ .name → "Motorový olej"
       ├─ .replacements-block
       │    └─ input.show-replacements-button[value="Náhrady"]
       │         [onclick="getProductReplacements('#ProductItem_{id}', 4, '{groupId}', '{code}', {articleId}, '', '', '', '', '', '{catalogId}', '', '', '', '{oe}', '{idx}', '{unitId}', '{ssd}')"]
       ├─ .flex-product-compare
       │    └─ input.flex-add-product-to-compare[value="Porovnat"]
       │         [onclick="addProductToCompare({groupId},'{linkId}'); return false;"]
       ├─ .tecdoc-numbers
       │    └─ div.tecdoc-number → "Nalezeno přes OE kód TecDoc® číslo {code}"
       ├─ .usage-numbers → "Užívaná čísla: ACEA C3, API SN/CF, BMW Longlife-04..."
       ├─ .flex-attributes                ← SPECYFIKACJE
       │    └─ .flex-wrapper
       │         (każdy wiersz: key + value)
       │         "Specifikace podle ACEA" = "C3"
       │         "Specifikace podle API"  = "SN/CF"
       │         "obsah [litr]"           = "1 l"
       │         "specifikace"            = "VW 504 00/507 00"
       │         "Třída viskozity SAE"    = "5W-30"
       ├─ .flex-delivery-times            ← DOSTĘPNOŚĆ
       │    └─ .flex-delivery-time-item
       │         ├─ .flex-total-amount → "> 10 ks"
       │         ├─ .flex-delivery-to-time-text → "Dodání zboží pozítří 23.03.2026"
       │         └─ .order-end-time → "Dnes do 15:00"
       ├─ .basket-container
       │    ├─ .flex-prices
       │    │    ├─ .flex-price-with-vat
       │    │    │    ├─ .flex-value.notranslate → "195,63"
       │    │    │    └─ .flex-currency → "Kč"
       │    │    └─ .flex-price (bez DPH) → "161,68 Kč bez DPH"
       │    └─ .flex-add-to-basket
       │         ├─ .flex-basket-spinner
       │         │    ├─ .flex-spinner-increment-button  → [+]
       │         │    ├─ input[type=text, value="1"]     ← ilość
       │         │    └─ .flex-spinner-decrement-button  → [-]
       │         └─ input.flex-add-to-basket-button[type=button]
       │              [onclick="addProductToBasket(...)"]
       └─ .flex-remove-from-basket-container
            └─ .removeButton_product_{groupId}
```

### Obrazek produktu – CDN TecAlliance:
```
https://digital-assets.tecalliance.services/images/3200/{sha1_hash}.jpg
// + data-flex-async-image-src = pełny URL z parametrami
```

### Obrazki techniczne YQ (rysunki):
```
https://img.altechopersys.com/{catalogId}/source/460/{imageId}.gif?s={token}&k={hash}
```

---

## Kluczowe funkcje JS

| Funkcja | Parametry | Opis |
|---|---|---|
| `getYqVehicleDetail(container, viewMode, catalogId, make, idx, ssd)` | viewMode: 0=obr, 1=strom | Przełącza zakładki |
| `getYqPicturesUnits(container, nodeId, idx, make, catalogId, ssd)` | nodeId: 1-9,0 | Filtr sidebar obr. |
| `selectYqPart(num)` | "1","2","3" | Selekcja OE na rysunku |
| `navigateToYqParts(lang, kat, type, dily, catalogId, idx, unitId, ssd)` | — | Przejście do produktów |
| `getYqProducts(container, sortMethod, onStock, purchPrice, viewMode, currentOE, oe, catalogId, idx, unitId, ssd, refresh, hiddenGroups, filtered, page, firstLoad, manufacturerFilter, event)` | — | AJAX lista produktów |
| `getProductReplacements(container, type, groupId, code, articleId, ..., oe, idx, unitId, ssd)` | — | Pobiera náhrady |
| `addProductToCompare(groupId, linkId)` | — | Porównaj produkty |
| `addProductToBasket(...)` | — | Dodaj do koszyka |
| `filterYqVehiclesByModel(searchText)` | — | Filtr pojazdów na str. VIN |

---

## Token SSD – jak działa

- `ssd` = **Session State Data** – zakodowany token sesji Laximo/YQ
- Generowany przy starcie sesji, **zmienia się przy każdym nowym load**
- Zawiera zakodowany stan sesji (pojazd, katalog, uprawnienia)
- Przekazywany przez cały flow jako query param `?ssd=...`
- Format: `$*Kw{base64_encoded_data}$`
- **Nie można go zgadnąć** – musi być pobrany ze strony VIN
- Po upływie czasu sesji → strona zwraca pustą zawartość (trzeba wznowić od VIN)

---

## Pełna mapa URL patterns
```
/cs/katalog/yq-katalog/vin/{VIN}
/cs/katalog/yq-katalog/vozidlo/{make}/{catalogId}/{idx}?ssd=...&vin=...
/cs/katalog/yq-katalog/skupiny/{make}/{slug}/{catalogId}/{idx}/{groupId}?ssd=...
/cs/katalog/yq-katalog/jednotka/{make}/{slug}/{catalogId}/{idx}/{unitId}?ssd=...&img=...&note=...
/cs/katalog/yq-katalog/dily/{oe_or_oes}/{catalogId}/{idx}/{unitId}?ssd=...
/cs/katalog/yq-katalog/dily/{oe}/{slug}/{catalogId}/{idx}/{unitId}/{groupId}?ssd=...
```

Gdzie:
- `{make}` = `skoda`, `vw`, `audi` itd.
- `{catalogId}` = `YQSE9`, `YQVW3` itd. – ID katalogu YQ dla danego modelu
- `{idx}` = `0` (indeks silnika/wariantu)
- `{groupId}` = numer grupy części (np. `10359` = olejový filtr)
- `{unitId}` = numer jednostki graficznej (np. `8528456`)
- `{oe}` = numer OE z `++` zamiast spacji (np. `G++052195M2`, `038115389d`)

Kluczowe wnioski dla replikacji:
SSD token jest krytyczny – bez niego żadna strona YQ nie zadziała. Trzeba zawsze startować od /yq-katalog/vin/{VIN} żeby dostać świeży token, który żyje przez czas sesji.
Zdjęcia techniczne (rysunki exploded view) są serwowane z img.altechopersys.com – to CDN Laximo. Hotspoty (.area) to absolutnie pozycjonowane <div>y nakładane na obraz z onclick="selectYqPart('{n}')".
Lista produktów ładuje się przez AJAX wywołaniem getYqProducts() – nie ma osobnej strony dla każdego produktu – to dynamiczny render w .products-list.