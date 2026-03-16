const { chromium } = require('playwright');

const BASE_URL = 'https://www.kiwoko.com/gatos/';

function parsePrice(rawPrice) {
  if (!rawPrice) {
    return null;
  }

  const str = String(rawPrice).trim();
  const match = str.match(/(\d+[.,]\d+|\d+)/);
  if (!match) {
    return null;
  }

  const numStr = match[1].replace(',', '.');
  const value = Number(numStr);
  return Number.isFinite(value) ? value : null;
}
function normalizeText(value) {
  return value ? String(value).replace(/\s+/g, ' ').trim() : '';
}

async function extractFromPage(page) {
  const items = await page.evaluate(() => {
    const toAbsoluteUrl = (value) => {
      if (!value) return null;
      try {
        return new URL(value, window.location.origin).toString();
      } catch {
        return null;
      }
    };

    const readNodeText = (node, selectors) => {
      for (const selector of selectors) {
        const found = node.querySelector(selector);
        if (found?.textContent?.trim()) {
          return found.textContent;
        }
      }
      return '';
    };

    const readNodeAttr = (node, selectors, attr) => {
      for (const selector of selectors) {
        const found = node.querySelector(selector);
        if (!found) continue;
        const value = found.getAttribute(attr);
        if (value) return value;
      }
      return '';
    };

    const flattenJsonLd = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value.flatMap(flattenJsonLd);
      }
      if (typeof value === 'object') {
        const fromGraph = value['@graph'] ? flattenJsonLd(value['@graph']) : [];
        return [value, ...fromGraph];
      }
      return [];
    };

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const jsonLdProducts = scripts
      .flatMap((script) => {
        try {
          return flattenJsonLd(JSON.parse(script.textContent || ''));
        } catch {
          return [];
        }
      })
      .filter((entry) => {
        const type = entry?.['@type'];
        if (Array.isArray(type)) return type.includes('Product');
        return type === 'Product';
      })
      .map((entry) => {
        const offers = Array.isArray(entry.offers) ? entry.offers[0] : entry.offers;
        const image = Array.isArray(entry.image) ? entry.image[0] : entry.image;

        return {
          title: entry.name || '',
          url: toAbsoluteUrl(entry.url || ''),
          rawPrice: offers?.price ? String(offers.price) : '',
          image: toAbsoluteUrl(image || ''),
          currency: offers?.priceCurrency || null
        };
      })
      .filter((item) => item.url && item.title && item.rawPrice);

    const cards = Array.from(
      document.querySelectorAll(
        '.isk-product-card, .js-isk-card-product, [data-testid="product-tile"], .product-tile, .product, li.product-grid-item, li.grid-tile'
      )
    );

    const cardItems = cards
      .map((card) => {
        const title = readNodeText(card, [
          '.isk-product-card__name',
          '.js-isk-product-card-name',
          '[data-testid="product-name"]',
          '.product-name',
          '.name',
          'h2',
          'h3',
          'a[title]'
        ]);

        const urlFromHref = readNodeAttr(card, ['a.ism-product-link[href]', 'a[href]'], 'href');
        const url = toAbsoluteUrl(urlFromHref);

        const titleFromUrl = (() => {
          if (!url) return '';
          try {
            const pathname = new URL(url).pathname;
            const slug = pathname.split('/').filter(Boolean).pop() || '';
            return slug
              .replace(/\.html?$/i, '')
              .replace(/_[^_]*$/, '')
              .replace(/[-_]+/g, ' ')
              .trim();
          } catch {
            return '';
          }
        })();

        const price = readNodeText(card, [
          '.isk-product-card__price',
          '.js-isk-product-card-price',
          '[data-testid="price"]',
          '.sales .value',
          '.price-sales',
          '.price',
          '.value'
        ]);

        const image =
          readNodeAttr(card, ['img'], 'src') || readNodeAttr(card, ['img'], 'data-src');

        return {
          title: title || titleFromUrl,
          url,
          rawPrice: price,
          image: toAbsoluteUrl(image),
          currency: null
        };
      })
      .filter((item) => item.url && item.title && item.rawPrice);

    return [...jsonLdProducts, ...cardItems];
  });

  const now = new Date().toISOString();

  return items.map((item) => {
    const parsedPrice = parsePrice(item.rawPrice);
    return {
      source: 'kiwoko',
      title: normalizeText(item.title),
      price: parsedPrice,
      rawPrice: Number.isFinite(parsedPrice)
        ? `${parsedPrice.toFixed(2)} EUR`
        : normalizeText(item.rawPrice),
      currency: item.currency || 'EUR',
      url: item.url,
      image: item.image,
      scrapedAt: now
    };
  });
}

async function extractCategoryLinks(page) {
  return page.evaluate(() => {
    const toAbsoluteUrl = (value) => {
      if (!value) return null;
      try {
        return new URL(value, window.location.origin).toString();
      } catch {
        return null;
      }
    };

    const links = Array.from(document.querySelectorAll('a[href*="/gatos/"]'))
      .map((anchor) => toAbsoluteUrl(anchor.getAttribute('href')))
      .filter(Boolean)
      .filter((url) => !url.includes('#'))
      .filter((url) => !url.includes('/search'))
      .filter((url) => !url.includes('?'));

    return Array.from(new Set(links));
  });
}

async function scrapeKiwokoCatsProducts({ maxPages = 4, headless = true } = {}) {
  const browser = await chromium.launch({ headless });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const allItems = [];
    const pagesToScan = Math.max(1, Math.min(maxPages, 12));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const categoryLinks = await extractCategoryLinks(page);
    const urlsToScan = [BASE_URL, ...categoryLinks].slice(0, pagesToScan);

    for (const url of urlsToScan) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);

      const pageItems = await extractFromPage(page);
      allItems.push(...pageItems);
    }

    const uniqueMap = new Map();
    for (const item of allItems) {
      if (!item.price && !item.rawPrice) {
        continue;
      }

      const key = item.url || `${item.title}-${item.rawPrice}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    return Array.from(uniqueMap.values());
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeKiwokoCatsProducts
};
