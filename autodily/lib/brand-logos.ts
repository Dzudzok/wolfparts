// Car brand logos — maps brand name → local filename in /logos/cars/
const CAR_BRAND_FILES: Record<string, string> = {
  "aston martin": "aston-martin", "audi": "audi", "bmw": "bmw", "chevrolet": "chevrolet",
  "citroen": "citroen", "citroën": "citroen", "dacia": "dacia", "dodge": "dodge",
  "ferrari": "ferrari", "fiat": "fiat", "ford": "ford", "honda": "honda",
  "hyundai": "hyundai", "jaguar": "jaguar", "jeep": "jeep", "kia": "kia",
  "land rover": "land-rover", "lexus": "lexus", "mazda": "mazda",
  "mercedes-benz": "mercedes-benz", "mercedes": "mercedes-benz",
  "mini": "mini", "nissan": "nissan", "opel": "opel", "peugeot": "peugeot",
  "renault": "renault", "seat": "seat", "skoda": "skoda", "škoda": "skoda",
  "tesla": "tesla", "toyota": "toyota", "volkswagen": "vw", "vw": "vw", "volvo": "volvo",
  "alfa romeo": "alfa-romeo", "chrysler": "chrysler", "daewoo": "daewoo",
  "daf": "daf", "daihatsu": "daihatsu", "isuzu": "isuzu", "lada": "lada",
  "mitsubishi": "mitsubishi", "porsche": "porsche", "rover": "rover",
  "saab": "saab", "smart": "smart", "subaru": "subaru", "suzuki": "suzuki",
};

// Manufacturer logos — maps brand name → local filename in /logos/brands/
const MANUFACTURER_FILES: Record<string, string> = {
  "a.b.s.": "abs", "abs": "abs", "brembo": "brembo", "a.i.c.": "ackoja",
  "ate": "ate", "abe": "abe", "kolbenschmidt": "kolbenschmidt", "ackoja": "ackoja",
  "kavo parts": "kavo-parts", "knecht": "knecht", "mahle original": "mahle-original",
  "ruville": "ruville", "fai autoparts": "fai-autoparts", "loro": "loro", "denso": "denso",
  "centra": "centra", "adbl": "adbl", "profipower": "profipower", "airtex": "airtex",
  "hengst filter": "hengst-filter", "liqui moly": "liqui-moly", "aisin": "aisin",
  "shell": "shell", "mobil": "mobil", "ajusa": "ajusa", "mannfilter": "mannfilter",
  "mann-filter": "mannfilter", "teknorot": "teknorot", "aral": "aral", "vasco": "vasco",
  "ashika": "ashika", "autofren": "autofren", "automega": "automega", "barum": "barum",
  "bga": "bga", "bilstein": "bilstein", "bizol": "bizol", "blic": "blic",
  "blue print": "blue-print", "bm catalysts": "bm-catalysts", "bosal": "bosal",
  "bosch": "bosch", "bremi": "bremi", "bts turbo": "bts-turbo", "caffaro": "caffaro",
  "corteco": "corteco", "castrol": "castrol", "champion": "champion",
  "clean filters": "clean-filters", "cofle": "cofle", "continental": "continental",
  "contitech": "continental", "continental ctam": "continental", "gates": "gates",
  "cs germany": "cs-germany", "daco germany": "daco-germany", "dayco": "dayco",
  "delphi": "delphi", "denckermann": "denckermann", "dpa": "dpa", "drmotor": "drmotor",
  "dr.motor automotive": "drmotor", "dri": "dri", "dys": "dys",
  "electric-life": "electric-life", "elf": "elf", "elring": "elring", "elstock": "elstock",
  "eneos": "eneos", "eps": "eps", "era": "era", "exedy": "exedy",
  "fa1": "fa1", "fae": "fae", "schaeffler fag": "mannfilter", "fai": "mannfilter",
  "fanfaro": "fanfaro", "febest": "febest", "febi": "febi", "febi bilstein": "febi",
  "ferodo": "ferodo", "filtron": "filtron", "freccia": "freccia", "frenkit": "frenkit",
  "fte": "fte", "fuchs": "fuchs", "goetze": "goetze", "goodyear": "goodyear",
  "graf": "graf", "breyko": "breyko", "gsp": "gsp", "hankook": "hankook",
  "hella": "hella", "hazet": "hazet", "hepu": "hepu", "hitachi": "hitachi",
  "hutchinson": "hutchinson", "japanparts": "japanparts", "jpn": "japanparts",
  "jp group": "jp-group", "k&n": "k-n", "k2": "k2", "kamoka": "kamoka",
  "kilen": "kilen", "ks tools": "ks-tools", "kyb": "kyb", "lauber": "lauber",
  "lemforder": "lemforder", "lemförder": "lemforder", "schaeffler luk": "luk", "luk": "luk",
  "magneti marelli": "magneti-marelli", "mahle": "mahle", "mannol": "mannol",
  "sct mannol": "mannol", "sct-mannol": "mannol", "sct  mannol": "mannol",
  "mastersport": "mastersport", "master-sport germany": "mastersport",
  "maxgear": "maxgear", "meat&doria": "meat-doria", "metelli": "metelli",
  "meyle": "meyle", "michelin": "michelin", "monroe": "monroe", "motul": "motul",
  "muller filter": "muller-filter", "narva": "narva", "ngk": "ngk",
  "nissens": "nissens", "nrf": "nrf", "opel": "opel", "orlen": "orlen",
  "osram": "osram", "ams-osram": "osram", "oximo": "oximo", "pascal": "pascal",
  "payen": "payen", "petronas": "petronas", "philips": "philips", "pirelli": "pirelli",
  "purflux": "purflux", "remsa": "remsa", "sachs": "sachs", "skf": "skf",
  "skv germany": "skv-germany", "esen skv": "skv-germany", "sonax": "sonax",
  "spidan": "spidan", "trw": "trw", "textar": "textar", "topran": "topran",
  "total": "total", "trucktec": "trucktec", "tyc": "tyc", "ufi": "ufi",
  "vag": "vag", "vaico": "vaico", "valeo": "valeo", "valvoline": "valvoline",
  "van wezel": "van-wezel", "varta": "varta", "vdo": "vdo", "continental/vdo": "vdo",
  "vemo": "vemo", "victor reinz": "victor-reinz", "reinz": "victor-reinz",
  "vika": "vika", "walker": "walker", "zimmermann": "zimmermann",
  "3rg": "3rg", "abakus": "abakus", "borsehung": "borsehung", "dolz": "dolz",
  "dt spare parts": "dt-spare-parts", "dunlop": "dunlop", "exide": "exide",
  "facet": "facet", "fast": "fast", "gkn": "gkn", "glyco": "glyco",
  "herthbuss": "herthbuss", "jurid": "jurid", "koni": "koni", "kraft": "kraft",
  "lesjofors": "lesjofors", "lpr": "lpr", "metalcaucho": "metalcaucho",
  "nipparts": "nipparts", "nk": "nk", "nty": "nty", "optimal": "optimal",
  "pemco": "pemco", "quick brake": "quick-brake", "samko": "samko", "sasic": "sasic",
  "snr": "snr", "swag": "swag", "thermotec": "thermotec", "tomex": "tomex",
  "triscan": "triscan", "ulo": "ulo", "wahler": "wahler", "borgwarner": "wahler",
  "yokohama": "yokohama", "schaeffler ina": "ina", "ina": "ina",
};

export function getManufacturerLogoUrl(brand: string): string {
  const key = brand.toLowerCase().trim();
  const file = MANUFACTURER_FILES[key];
  return file ? `/logos/brands/${file}.png` : `/logos/brands/default.png`;
}

export function getCarBrandLogoUrl(brand: string): string {
  const key = brand.toLowerCase().trim();
  const file = CAR_BRAND_FILES[key];
  return file ? `/logos/cars/${file}.png` : "";
}

export function hasManufacturerLogo(brand: string): boolean {
  return brand.toLowerCase().trim() in MANUFACTURER_FILES;
}
