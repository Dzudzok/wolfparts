/**
 * Manages a persistent logged-in browser session to mroauto.cz
 * Uses Puppeteer (headless Chrome) for JS-rendered pages like VIN/YQ-katalog
 */

import puppeteer, { Browser, Page } from "puppeteer";

let browser: Browser | null = null;
let sessionPage: Page | null = null;
let loggedIn = false;

const MRO_LOGIN = process.env.NEXTIS_API_LOGIN || "test1";
const MRO_PASSWORD = process.env.NEXTIS_API_PASSWORD || "test11";

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  loggedIn = false;
  return browser;
}

async function login(): Promise<void> {
  if (loggedIn) return;

  const b = await getBrowser();
  sessionPage = await b.newPage();
  await sessionPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

  console.log("[mroauto] Logging in...");
  await sessionPage.goto("https://www.mroauto.cz/cs", { waitUntil: "networkidle2", timeout: 30000 });

  // Login form might be hidden - use evaluate to fill and submit
  const loginSuccess = await sessionPage.evaluate((user: string, pass: string) => {
    // The inputs exist in the DOM but may be in a hidden popup
    const usernameEl = document.querySelector("#UsernamePopUp") as HTMLInputElement;
    const passwordEl = document.querySelector("#PasswordPopUp") as HTMLInputElement;

    if (!usernameEl || !passwordEl) return "no_fields";

    // Set values directly
    usernameEl.value = user;
    passwordEl.value = pass;

    // Trigger the login function if it exists
    if (typeof (window as any).login === "function") {
      (window as any).login("UsernamePopUp", "PasswordPopUp");
      return "login_called";
    }

    // Fallback: click the login button
    const btn = document.querySelector("#LoginButton") as HTMLInputElement;
    if (btn) {
      // Remove form action like the original JS does
      const form = document.querySelector("#form1") as HTMLFormElement;
      if (form) form.removeAttribute("action");
      btn.click();
      return "btn_clicked";
    }

    return "no_button";
  }, MRO_LOGIN, MRO_PASSWORD);

  console.log("[mroauto] Login action:", loginSuccess);

  // Wait for page to reload/update after login
  await sessionPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  // Verify login
  const isLoggedInNow = await sessionPage.evaluate(() => {
    return !!document.querySelector(".customer-name") ||
           document.body.innerHTML.includes("Odhlásit") ||
           !document.querySelector("#UsernamePopUp");
  });
  console.log("[mroauto] Login verified:", isLoggedInNow);

  loggedIn = true;
  console.log("[mroauto] Logged in successfully");
}

export interface VinVehicle {
  name: string;
  model: string;
  engine: string;
  engineCode: string;
  years: string;
  gearbox: string;
  url: string;
}

export async function searchVin(vin: string): Promise<VinVehicle[]> {
  await login();

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    // Copy cookies from session page
    if (sessionPage) {
      const cookies = await sessionPage.cookies();
      await page.setCookie(...cookies);
    }

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    await page.goto(`https://www.mroauto.cz/cs/katalog/yq-katalog/vin/${vin}`, {
      waitUntil: "networkidle2",
      timeout: 20000,
    });

    // Wait for vehicle list to appear
    await page.waitForSelector(".flex-item, .flex-vehicles-list", { timeout: 10000 }).catch(() => {});

    // Extract vehicle data
    const vehicles = await page.evaluate(() => {
      const items = document.querySelectorAll("a.flex-item");
      return Array.from(items).map((el) => ({
        name: el.querySelector(".flex-name")?.textContent?.trim() || "",
        model: el.querySelector(".flex-model")?.textContent?.trim() || "",
        engine: el.querySelector(".flex-engine")?.textContent?.trim() || "",
        engineCode: el.querySelector(".flex-engine-code")?.textContent?.trim() || "",
        years: el.querySelector(".flex-vehicle-date")?.textContent?.trim() || "",
        gearbox: el.querySelector(".flex-gearbox")?.textContent?.trim() || "",
        url: (el as HTMLAnchorElement).href || "",
      }));
    });

    return vehicles;
  } finally {
    await page.close();
  }
}

export interface VinCategory {
  name: string;
  url: string;
  isGroup: boolean;
}

export async function getVinCategories(vehicleUrl: string): Promise<VinCategory[]> {
  await login();

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    if (sessionPage) {
      const cookies = await sessionPage.cookies();
      await page.setCookie(...cookies);
    }

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    await page.goto(vehicleUrl, { waitUntil: "networkidle2", timeout: 20000 });

    // Click "Stromové zobrazení" tab if available
    await page.click("#TreeViewTabButton").catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    const categories = await page.evaluate(() => {
      const results: Array<{ name: string; url: string; isGroup: boolean }> = [];

      // Tree view links
      document.querySelectorAll(".tree .node a").forEach((el) => {
        const href = (el as HTMLAnchorElement).href || "";
        const name = el.textContent?.trim() || "";
        if (!name) return;
        results.push({
          name,
          url: href.includes("void(0)") ? "" : href,
          isGroup: href.includes("void(0)"),
        });
      });

      // Also picture view items
      if (results.length === 0) {
        document.querySelectorAll(".flex-pictures-view-list a").forEach((el) => {
          const href = (el as HTMLAnchorElement).href || "";
          const name = el.querySelector(".flex-name")?.textContent?.trim() || "";
          if (name) {
            results.push({ name, url: href, isGroup: false });
          }
        });
      }

      return results;
    });

    return categories;
  } finally {
    await page.close();
  }
}

export interface VinOePart {
  position: string;
  oe: string;
  name: string;
  url: string;
}

export interface VinProduct {
  brand: string;
  code: string;
  name: string;
  imageUrl: string;
  price: string;
  priceNoVat: string;
  stock: string;
  deliveryInfo: string;
}

/**
 * Scrapes a skupiny page (OE list) or dily page (product list)
 */
export async function getVinParts(pageUrl: string): Promise<{ oes: VinOePart[]; products: VinProduct[]; title: string }> {
  await login();

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    if (sessionPage) {
      const cookies = await sessionPage.cookies();
      await page.setCookie(...cookies);
    }

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      const title = document.querySelector(".flex-title, .yq-group .title span")?.textContent?.trim() || "";

      // OE numbers (skupiny page)
      const oes: Array<{ position: string; oe: string; name: string; url: string }> = [];
      document.querySelectorAll(".oes a, .group-list .oes a").forEach((el) => {
        const href = (el as HTMLAnchorElement).href || "";
        const pos = el.querySelector(".number")?.textContent?.trim() || "";
        const oe = el.querySelector(".oe")?.textContent?.trim() || "";
        const name = el.querySelector(".name")?.textContent?.trim() || "";
        if (oe) oes.push({ position: pos, oe, name, url: href });
      });

      // Products (dily page)
      const products: Array<{
        brand: string; code: string; name: string; imageUrl: string;
        price: string; priceNoVat: string; stock: string; deliveryInfo: string;
      }> = [];

      document.querySelectorAll("[id^='ProductItem_']").forEach((el) => {
        const brandCode = el.querySelector(".manufacturer-code")?.textContent?.trim() || "";
        const name = el.querySelector(".name")?.textContent?.trim() || "";
        const img = el.querySelector(".flex-image-wrapper img") as HTMLImageElement;
        const imageUrl = img?.src || "";
        const priceEl = el.querySelector(".flex-price-with-vat .flex-value");
        const price = priceEl?.textContent?.trim() || "";
        const priceNoVatEl = el.querySelector(".flex-price .flex-value");
        const priceNoVat = priceNoVatEl?.textContent?.trim() || "";
        const stockEl = el.querySelector(".flex-total-amount");
        const stock = stockEl?.textContent?.trim() || "";
        const deliveryEl = el.querySelector(".flex-delivery-to-time-text");
        const deliveryInfo = deliveryEl?.textContent?.trim() || "";

        // Split brand and code from "FEBI BILSTEIN 32945"
        const parts = brandCode.split(/\s+/);
        const code = parts.pop() || "";
        const brand = parts.join(" ");

        if (brand || code) {
          products.push({ brand, code, name, imageUrl, price, priceNoVat, stock, deliveryInfo });
        }
      });

      return { oes, products, title };
    });

    return result;
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    sessionPage = null;
    loggedIn = false;
  }
}
