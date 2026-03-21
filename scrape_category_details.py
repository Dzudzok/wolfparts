import requests
from bs4 import BeautifulSoup
import json
import time
import sys

BASE_URL = "https://www.mroauto.cz"
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


def get_soup(url):
    time.sleep(1)
    print(f"Fetching: {url}")
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return BeautifulSoup(r.text, 'html.parser')


def extract_categories(soup):
    categories = []
    for a in soup.select("a[data-node-id]"):
        href = a.get("href")
        if not href:
            continue
        if href.startswith("javascript:"):
            # Pomijamy sztuczne linki
            continue
        if not href.startswith("/"):
            # Pomijamy cokolwiek dziwnego
            continue

        name = a.select_one("span.name").get_text(strip=True)
        node_id = a["data-node-id"]
        is_end_node = a.get("data-is-end-node", "false") == "true"

        categories.append({
            "name": name,
            "node_id": node_id,
            "is_end_node": is_end_node,
            "href": BASE_URL + href
        })

    return categories



def scrape_products_for_genartid(category_url):
    soup = get_soup(category_url)
    items = soup.select("div[data-flex-tecdoc-generic-article-id]")
    genartids = set()
    for item in items:
        genartid = item.get("data-flex-tecdoc-generic-article-id")
        if genartid:
            genartids.add(int(genartid))
    return list(genartids)


def walk_category_tree(url, path, results):
    soup = get_soup(url)
    categories = extract_categories(soup)

    if not categories:
        print(f"⚠️ Brak podkategorii na stronie: {url}")
        return

    for cat in categories:
        new_path = path + [cat["name"]]
        print(f"➡️ Kategoria: {' > '.join(new_path)}")

        if cat["is_end_node"]:
            print(f"   🔍 Leaf node - pobieranie produktów...")
            genartids = scrape_products_for_genartid(cat["href"])
            if genartids:
                for gid in genartids:
                    results.append({
                        "path": new_path,
                        "genArtID": gid
                    })
            else:
                print("   ⚠️ Brak produktów w tej kategorii.")
        else:
            # ma dzieci, wchodzimy głębiej
            walk_category_tree(cat["href"], new_path, results)


if __name__ == "__main__":
    # -----------------------------
    # Wczytaj vehicles_data.json
    with open("vehicles_data.json", "r", encoding="utf-8") as f:
        vehicles_data = json.load(f)

    brands = vehicles_data["brands"]
    print("\nDostępne marki:")
    for idx, brand in enumerate(brands):
        print(f"{idx + 1}. {brand['name']} (id={brand['id']})")
    brand_sel = int(input("\nWybierz numer marki: ")) - 1
    brand = brands[brand_sel]

    print("\nDostępne modele:")
    for idx, model in enumerate(brand["models"]):
        print(f"{idx + 1}. {model['name']} (id={model['id']})")
    model_sel = int(input("\nWybierz numer modelu: ")) - 1
    model = brand["models"][model_sel]

    print("\nDostępne silniki:")
    for idx, engine in enumerate(model["engines"]):
        print(f"{idx + 1}. {engine['name']} (id={engine['id']})")
    engine_sel = int(input("\nWybierz numer silnika: ")) - 1
    engine = model["engines"][engine_sel]

    engine_id = engine["id"]
    print(f"\n✅ Wybrano: {brand['name']} / {model['name']} / {engine['name']} (engineID={engine_id})")

    # -----------------------------
    # Zbuduj URL startowy dla kategorii
    start_url = f"https://www.mroauto.cz/cs/katalog/tecdoc/osobni/{brand['name'].lower().replace(' ', '-')}/{model['name'].split()[0].lower()}/{engine_sel+1}/{brand['id']}/{model['id']}/{engine_id}"
    print(f"\n🌐 Start URL kategorii:\n{start_url}")

    # -----------------------------
    # Scrapowanie kategorii
    results = []
    walk_category_tree(start_url, [], results)

    if not results:
        print("\n❌ Nie znaleziono kategorii ani produktów.")
        sys.exit(0)

    # -----------------------------
    # Zapis do pliku
# -----------------------------
# Aktualizacja / Zapis do pliku
    try:
        with open("categories_data.json", "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = []

    # Szukamy wpisu z tym engineID
    updated = False
    for entry in existing_data:
        if entry.get("engineID") == engine_id:
            entry["categories"] = results
            updated = True
            print(f"✅ Zaktualizowano istniejący wpis dla engineID={engine_id}")
            break

    if not updated:
        # Dodaj nowy
        existing_data.append({
            "engineID": engine_id,
            "categories": results
        })
        print(f"✅ Dodano nowy wpis dla engineID={engine_id}")

    # Zapisujemy całość
    with open("categories_data.json", "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)

    print("\n✅ Wynik zapisany/aktualizowany do categories_data.json")
