Odwzoruj wizualnie stronę mlparts.cz w naszym projekcie Next.js + Tailwind CSS. Oto dokładny opis jak strona wygląda:

---

## DESIGN SYSTEM / ZMIENNE KOLORÓW

CSS Custom Properties (zmienne projektu):
- Primary / akcent: #D80213 (czerwony, główny kolor marki)
- Czerwony ciemniejszy (badge'e, tagi): #E30613
- Text color główny: #5A5E6A (ciemny szary-granatowy)
- Text color ciemniejszy (linki footer, przyciski): #3E4149
- Link color: #D80213 (czerwony = linki produktów, nazwy)
- Background strony (body): #5A5E6A (szaro-granatowy)
- Background headera: #5A5E6A (ten sam szaro-granatowy)
- Background głównej treści: #FFFFFF (biały)
- Background footer: #FFFFFF
- Granica sekcji / linie: rgba(9, 0, 43, 0.1) oraz #DCE2EB
- Btn default (szary): #DCE2EB, tekst: #3E4149
- Btn primary (czerwony): #D80213, tekst: #FFFFFF
- Form control / input bg: white, gradient: linear-gradient(180deg, #eef1f5, #fff)
- Zielony (dostępność, "Sklad Brno"): rgb(89, 199, 54) = #59C735
- Pomarańczowy (tag "najtańszy"): #E89535
- Czarny piątek badge: #000000
- Help contact bar bg: #8C919D
- Chatbox bg (sticky): #D80213

Font: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Font size root: 15px
Font weights: 400 (normal), 600 (semibold), 700 (bold)
Border radius globalny: 4px

---

## 1. LAYOUT I STRUKTURA OGÓLNA

Strona ma układ **sidebar + main content** (2 kolumny):
- **Lewa kolumna** (sidebar): 361px szerokości, sticky, zawiera nawigację kategorii
- **Prawa kolumna** (main): ~1084px, biały background (#FFFFFF)
- Całość opakowana w kontener z body background #5A5E6A (szaro-granatowy widoczny na bokach)

Ogólny layout strony (od góry do dołu):
1. HEADER (sticky, height: 112px, tło #5A5E6A)
2. MAIN CONTENT (sidebar 361px + content 1084px)
3. FOOTER (biały #FFFFFF)
4. FIXED CHATBOX (prawy dół ekranu)

---

## 2. HEADER / NAWIGACJA

Header jest **sticky**, height: 112px, background: #5A5E6A (szaro-granatowy).

**Struktura headera (2 wiersze, flex row):**

**Wiersz górny (56px wysokości) — MENU BAR:**
- Lewa strona: logo ML PARTS (PNG, białe litery + ikona tarczy hamulcowej, szerokość ~237px, tło przezroczyste — logo jest na czerwonym tliku mlpartsHeader__logoBar ~358px)
- Prawa strona: poziome menu nawigacyjne

Nawigacja pozioma w headerze (białe przyciski/linki na szarym tle):
- "KATEGORIE" — przycisk (dropdown)
- "VŠE O NÁKUPU" — link
- "KONTAKT" — link
- ikona flagi CZ + "MLPARTS.CZ" — dropdown przełącznik języka/kraju
- "MŮJ PROFIL" — przycisk z ikoną użytkownika (avatar szary)
- "NÁKUPNÍ KOŠÍK" — link z ikoną koszyka czerwonego (outlajn)

Czcionka nav: 13.125px, font-weight: 600, kolor: #FFFFFF (biały), uppercase z letter-spacing

**Wiersz dolny (56px wysokości) — SEARCH BAR:**
Rozciąga się przez całą szerokość prawej kolumny (od początku nav po prawą krawędź).
- Input pola search: background #FFFFFF, border-radius: 4px, padding: 0 56px 0 12px
- Placeholder: "Vyhledávejte dle čísla dílu, OEM, VIN,…" kolor #5A5E6A
- Przycisk search (lupa): transparentne tło, border-radius: 0 4px 4px 0, ikona lupy
- Focus box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35)

**Logo area** (lewa strona headera, ~358px):
- Tło: #5A5E6A (jak cały header)
- Logo: białe "ML PARTS" + podtytuł "Váš dodavatel autodílů" + ikona tarczy (SVG)
- Pod logo: biały tekst, font-size ok. 18-20px bold

---

## 3. LEWY SIDEBAR (kategorie główne)

**Sidebar**: width 361px, position sticky, tło przezroczyste (widać białe tło main content za nim — jest na białym tle).
Faktycznie sidebar leży na białym obszarze, który jest tłem całej sekcji content.

**Elementy listy kategorii** (`.sidebarTree__link--1`):
- Layout: flex row, align-items center
- Padding: 8px 0 8px 8px
- Tło: transparentne (hover: lekki szary)
- Kolor tekstu: #5A5E6A
- Font-size: 15px, font-weight: 600
- Border-bottom: brak (lub bardzo subtelna linia)
- Po lewej: **miniaturka produktu** (zdjęcie ~40x40px)
- Tekst główny: **nazwa kategorii** (bold, 15px)
- Tekst dodatkowy pod: **podtytuł kategorii** (szary, 13px, font-weight: 400)
- Po prawej: ikona "+" (dla kategorii z podkategoriami), kolor #5A5E6A

Przykłady kategorii:
- "Autodíly" / "podle vozu" (zdjęcie czerwonego auta)
- "Motodíly" / "podle motorky" (zdjęcie motocykla)
- "Oleje" / "Auto, moto, převodové" (zdjęcie kanistra)
- i kolejne...

---

## 4. GŁÓWNA TREŚĆ (prawa kolumna, tło białe #FFFFFF)

### 4.1 SEKCJA: Wybór pojazdu

**Nagłówek H2**: "Vyberte vůz pro který hledáte autodíly"
- Color: #5A5E6A, font-size: 20.25px (~1.35rem), font-weight: 700
- Margin bottom: ~17px

**Podtytuł**: "Přes tříkrokový výběr"
- Font-size: 15px, color: #5A5E6A

**Widget wyboru pojazdu** (flex row, gap ~8px):
- 4 ikony/przyciski typu pojazdu: Garáž | auto osobowe | auto dostawcze | motocykl
  - Aktywny przycisk "Garáž": background #DCE2EB, color #3E4149, font-weight 600, border-radius 4px, padding 0 16px, height 48px
  - Nieaktywne: tylko ikona, transparentne, hover: #DCE2EB
- 3 dropdown selecty: "Značka", "Model", "Motorizace"
  - Background: biały/gradient #eef1f5→#fff, border: 1px solid #CBD1DB, border-radius: 4px, height: 48px, font-weight: 700, color #5A5E6A
  - Label nad selectem: małe, font-size ~11px, color czerwony #D80213
- Przycisk strzałka submit (→): tło #DCE2EB (zmienia się na #D80213 gdy pojazd wybrany), color #FFF, border-radius: 4px, height 48px, width ~48px

Tekst "Nebo začněte výběrem z nejběžnějších značek": font-size 15px, color #5A5E6A

### 4.2 SEKCJA: Marki samochodów (brand grid)

**H2**: "Autodíly" — kolor #5A5E6A, 20.25px, bold

**Grid marek** — 8 kolumn na desktop, 2 wiersze:
- Każda karta marki: background #FFFFFF, border-radius: 4px, box-shadow: rgba(0,0,0,0.1) 0px 0px 3px 0px
- Wymiary karty: ~132px × 92px
- Wewnątrz: logo marki (SVG/PNG, 64px wysokości, centorwane), pod logo: nazwa marki uppercase, font-size ~12px, color #5A5E6A, font-weight 600
- Hover: lekki shadow lub border
- Ostatni element "Všechny značky" — kolor #D80213 (czerwony), tekst bold

Marki: AUDI, CITROËN, PEUGEOT, SKODA, VW, FORD, FIAT, RENAULT (wiersz 1), BMW, MERCEDES-BENZ, VOLVO, KIA, HYUNDAI, MAZDA, OPEL, "Všechny značky" (wiersz 2)

### 4.3 SEKCJA: Najczęściej wymieniane części

**H2**: "Nejčastěji měněné díly"

**Grid kategorii** — 8 kolumn × 2 wiersze (łącznie 16 pozycji):
- Karta: background #FFFFFF, border: 1px solid rgba(9,0,43,0.1), border-radius: 4px
- Wewnątrz: duże zdjęcie części (~100px), pod nim: nazwa kategorii
- Kolor tekstu: #5A5E6A, font-size: 15px
- Hover: brak widocznego efektu lub subtelny shadow

Pozycje: Brzdy, Spojka, Zavěšení, Řízení, Filtry, Řemeny, Chlazení motoru, Palivový systém (wiersz 1) + Těsnění, Sací systém, Výfukový systém, Klimatizace, Stěrače, Karosérie, Elektroinstalace, Lambda sonda (wiersz 2)

---

## 5. SEKCJE PRODUKTÓW (karty produktów)

Produkty wyświetlane są w **carousel/swiper** — 4 widoczne karty na desktop (szerokość karty ~267px, wysokość ~416px).

**Struktura karty produktu** (`.productCollection`):
- Background: transparentne (karty leżą na białym bg sekcji)
- Border: 1px solid rgba(0,0,0,0) (transparentny, pojawia się hover)
- Border-radius: 4px

**Wewnątrz karty od góry:**

1. **Obszar z badge'ami** (absolutnie pozycjonowane, lewy górny róg):
   - Tag "NOVINKA": background #FFFFFF, color #59C735 (zielony), font-size: 11.25px, font-weight: 700, border-radius: 4px, padding: 0 6px, text-transform: uppercase
   - Tag "DOPORUČUJEME": background #E30613 (czerwony), color #FFFFFF, font-size: 11.25px, font-weight: 600, border-radius: 4px, padding: 0 6px, uppercase
   - Tag "-53 %": background #E30613, color #FFFFFF, font-size: 15px, font-weight: 700, border-radius: 4px, padding: 0 6px

2. **Zdjęcie produktu** (`.productCollection__image`):
   - Background: #FFFFFF, border-radius: 4px
   - Zdjęcie centorwane, aspect-ratio zachowany

3. **Nazwa produktu** (link `<a>`):
   - Color: #D80213 (czerwony link!)
   - Font-size: 15px, font-weight: 400, line-height: 22.5px
   - Hover: podkreślenie lub ciemniejszy czerwony

4. **Cena** (`.productPricesSimple__userPrice`):
   - Color: #5A5E6A, font-size: 16.5px, font-weight: 700
   - Np. "5 378 Kč"

5. **Cena przekreślona** (`.productPricesSimple__strikethroughPrice`):
   - Color: #E30613 (czerwony), font-size: 13.2px
   - Tekst przekreślony (line-through)
   - Wyświetlana gdy jest zniżka

6. **Dostępność** (`.productAvailabilityShort`):
   - "Sklad Brno" — kolor: #59C735 (zielony), font-size: 13.2px, font-weight: 400
   - Ikona zielonej ciężarówki/strzałki po lewej
   - Ilość np. "4 ks"
   - Drugi wiersz: "můžete mít: úterý 24. 3. od 07:00" — kolor #5A5E6A, font-size ~13px

**Nagłówek sekcji produktów** (`.pagePartProductGroup__heading`):
- Font-size: 20.25px, font-weight: 700, color: #5A5E6A
- Np. "Letní dovolená HAKR", "Snížili jsme ceny vybraných olejů"
- Strzałki nawigacji carousel: po lewej i prawej stronie (okrągłe przyciski lub liniowe)

---

## 6. BANNER PROMOCYJNY

Pełnowymiarowy banner między sekcjami produktów:
- Szerokość: 100% main content (1084px)
- Wysokość: ~192px
- Zawiera: zdjęcie tematyczne + duży tekst (np. "Vybrané motorové oleje za ještě lepší ceny" — czerwony tekst #D80213, font-size ~32-36px, font-weight: 700)
- Klikalne — link do kategorii

---

## 7. WYSZUKIWARKA

Wyszukiwarka jest **w headerze**, drugi wiersz, szerokość od ~360px do prawej krawędzi.

Styl:
- Kontener: height 56px, flex row
- Input: type="search", background #FFFFFF, border-radius: 4px, font-size: 15px, font-weight: 600, color #5A5E6A, padding: 0 56px 0 12px
- Placeholder: "Vyhledávejte dle čísla dílu, OEM, VIN,…" — kolor #5A5E6A
- Przycisk z lupą: transparentne tło, border-radius: 0 4px 4px 0, ikona lupy (szara)
- Focus: box-shadow 0 0 0 1px rgba(0,0,0,0.35)

Dodatkowa wyszukiwarka jest też dostępna jako overlay/dropdown (otwierana przyciskiem w headerze mobilnym).

---

## 8. FOOTER

Footer ma **białe tło** (#FFFFFF), kolor tekstu #5A5E6A.

**Struktura footera od góry:**

### 8.1 Pasek kontaktowy (`.mlpartsHelpContact`)
- Tło: #8C919D (średni szary), kolor tekstu: #FFFFFF
- Height: 80px
- Layout: flex row, space-between, align-center
- Zawiera: "Potřebujete poradit s výběrem dílů?" | ikona telefonu + numer +420 722 537 981 + "pondělí–pátek 8:30 – 17:30" | ikona koperty + "info@mlparts.cz"

### 8.2 Sekcja sklepu (`.mlpartsFooter__storeInBrno`)
- Layout: flex row
- Lewa strona (tekst ~715px):
  - "Prodejna v Brně" — H bold
  - "Vyzvednutí objednávek z e-shopu", "Výdejní box 24/7"
  - Adres: "Hněvkovského 66A Brno" bold
  - Godziny otwarcia (tekst szary)
  - Przycisk "Navigovat k prodejně": background #DCE2EB, color #5A5E6A, border-radius: 3px, padding z ikoną nawigacji
- Prawa strona: zdjęcie sklepu (#715px)

### 8.3 Benefits nav (`.mlpartsFooter__benefitsNav`)
- 2 linki w flex row:
  - "Doprava po celé ČR a SR" (ikona paczki)
  - "Rozvoz pro servisy po Brně a okolí" (ikona ciężarówki)
- Color linków: #5A5E6A, font-size: 15px
- Po prawej strzałka →

### 8.4 Linki nawigacyjne (`.mlpartsFooter__articleLinks`)
- Flex row, 6 linków: "DOPRAVA A PLATBA" | "OBCHODNÍ PODMÍNKY" | "VRÁCENÍ ZBOŽÍ" | "REKLAMACE ZBOŽÍ" | "VÝMĚNNÝ DÍL – ZÁLOHA NA STARÝ DÍL" | "KONTAKT"
- Styl: color #3E4149, font-size: 15px, font-weight: 600, text-transform: uppercase, letter-spacing: -0.45px

### 8.5 Partnerzy (`.mlpartsFooter__partners`)
- Loga: Heureka "Ověřeno zákazníky", gwiazdki oceny, DPD, Zásilkovna, PPL (dostawcy), Comgate, VISA, MasterCard, Google Pay, Apple Pay (płatności)
- TecDoc logo z copyrightem

---

## 9. STAŁY WIDGET POMOCY (fixed chatbox)

- Position: fixed, bottom: 0, right: 20px
- Tło: #D80213 (czerwony)
- Kolor tekstu: #FFFFFF
- Border-radius: 4px 4px 0 0 (zaokrąglone górne rogi)
- Zawiera: ikonę czatu + tekst "Napište nám"
- Hover: ciemniejszy czerwony

Nad chatboxem jest też stały przycisk "Potřebujete poradit?" z łukiem/wskazówką, wskazujący na chatbox.

---

## 10. RESPONSYWNOŚĆ

- **Desktop** (>1200px): 2-kolumnowy layout z sidebar 361px + content 1084px
- **Breakpointy** sugerowane: sidebar znika na mobile, pojawia się hamburger menu
- Mobilny temat kolor: #D80213
- Na mobile header redukuje się do logo + hamburger + ikony koszyka/profilu
- Grid kategorii: 8 kolumn → 4 kolumny → 2 kolumny
- Grid marek: 8 → 4 → 2
- Product carousel: 4 karty → 2 → 1

---

## 11. SZCZEGÓLNE ELEMENTY UI

- **Separator/divider**: rgba(9, 0, 43, 0.1) linia
- **Box-shadow kart marek**: rgba(0,0,0,0.1) 0px 0px 3px 0px
- **Hover efekty**: subtelne (shadow, podkreślenie linku)
- **Ikony**: SVG/PNG, 40×40px w sidebarze, duże zdjęcia w gridzie kategorii (100×100px)
- **Swiper/carousel** dla sekcji produktów z przyciskami prev/next
- **Brak animacji** przy ładowaniu (brak skeleton po load), proste transitions
- **VIN widget**: sekcja "Vyhledávejte díly v originálních schématech dle VIN" — nagłówek H2, klikalna sekcja (link do wyszukiwarki VIN)
- **Flaga CZ**: w headerze, małe emoji/obrazek flagi przy przełączniku kraju
- **Ikona koszyka**: outlajn koszyka (czerwony #D80213) z badge liczby produktów
- **Ikona użytkownika**: szary awatar kołowy w headerze

---

## 12. PODSUMOWANIE KOLORÓW DO TAILWIND CONFIG
```js
colors: {
  primary: '#D80213',       // czerwony główny
  'primary-dark': '#B8010F', // hover czerwony
  'primary-badge': '#E30613', // badge/tag czerwony
  text: '#5A5E6A',           // główny szary
  'text-dark': '#3E4149',    // ciemniejszy tekst
  bg: '#5A5E6A',             // tło body/header
  'bg-white': '#FFFFFF',     // białe tło treści
  border: '#DCE2EB',         // ramki, przyciski szare
  'border-light': 'rgba(9, 0, 43, 0.1)', // subtelne linie
  green: '#59C735',          // dostępność
  orange: '#E89535',         // tag "najtańszy"
  'help-bar': '#8C919D',     // pasek kontaktowy
}
```

Tekst przycisków default: #3E4149 na tle #DCE2EB
Tekst przycisków primary: #FFFFFF na tle #D80213
Wszystkie border-radius: 4px (globalnie)
Wysokość przycisków/inputów: 48px (--sf-btn-height)