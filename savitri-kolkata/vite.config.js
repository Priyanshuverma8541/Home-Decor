import { defineConfig } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const landingPages = [
  ["jewellery-in-kolkata", "Jewellery in Kolkata | Savitri Livings", "Explore real Savitri Livings jewellery in Kolkata. Browse current products and ask about stock and area-level delivery options."],
  ["jewellery-new-town", "Jewellery in New Town, Kolkata | Savitri Livings", "Discover Savitri Livings jewellery near New Town, Kolkata. Explore current catalogue listings and ask us to confirm local availability."],
  ["jewellery-rajarhat", "Jewellery in Rajarhat, Kolkata | Savitri Livings", "Find jewellery around Rajarhat, Kolkata. Browse real Savitri Livings products and confirm stock and delivery with our team."],
  ["jewellery-salt-lake", "Jewellery in Salt Lake, Kolkata | Savitri Livings", "Browse the Savitri Livings jewellery collection near Salt Lake. Ask about current stock and local delivery options."],
  ["jewellery-sector-v", "Jewellery in Sector V, Kolkata | Savitri Livings", "Discover Savitri Livings jewellery around Sector V, Kolkata. Explore real catalogue items and check area availability on WhatsApp."],
  ["jewellery-kolkata", "Jewellery in Kolkata | Savitri Livings", "Discover earrings, necklaces, rings, bangles and occasion jewellery from Savitri Livings in Kolkata."],
  ["affordable-jewellery-kolkata", "Affordable Jewellery in Kolkata | Savitri Livings", "Explore real Savitri Livings jewellery at a range of listed prices. Compare current catalogue prices and ask about stock."],
  ["artificial-jewellery-kolkata", "Artificial Jewellery in Kolkata | Savitri Livings", "Browse fashion jewellery from the live Savitri Livings catalogue. Ask our team to confirm material details and availability."],
  ["jewellery-gifts-kolkata", "Jewellery Gifts in Kolkata | Savitri Livings", "Find a thoughtful jewellery gift from the current Savitri Livings catalogue. Ask for help choosing and checking availability."],
  ["trending-jewellery-kolkata", "Trending Jewellery in Kolkata | Savitri Livings", "Discover featured and seasonal jewellery pieces from Savitri Livings. Explore real catalogue products and ask about stock."],
];

function staticSeoPages() {
  return {
    name: "kolkata-static-seo-pages",
    apply: "build",
    async closeBundle() {
      const dist = path.resolve("dist");
      const template = await readFile(path.join(dist, "index.html"), "utf8");
      const configuredSite = process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
      for (const [slug, title, description] of landingPages) {
        const safeTitle = title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const safeDescription = description.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const canonical = configuredSite ? `${configuredSite.replace(/\/$/, "")}/${slug}` : "";
        const body = `<div id="app"><main class="seo-fallback"><p>SAVITRI LIVINGS · KOLKATA LOCAL DISCOVERY</p><h1>${safeTitle.replace(" | Savitri Livings", "")}</h1><p>${safeDescription}</p><a href="/#latest">Explore current jewellery</a></main></div>`;
        const html = template.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
          .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${safeDescription}" />`)
          .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${safeTitle}" />`)
          .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${safeDescription}" />`)
          .replace("</head>", `${canonical ? `<link rel="canonical" href="${canonical}" />` : ""}</head>`)
          .replace(/<div id="app">[\s\S]*?<\/div><\/div>/, body);
        const target = path.join(dist, slug, "index.html");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html);
      }
      if (configuredSite) {
        const urls = ["", ...landingPages.map(([slug]) => `/${slug}`)];
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${configuredSite.replace(/\/$/, "")}${url}</loc></url>`).join("")}</urlset>`;
        await writeFile(path.join(dist, "sitemap.xml"), sitemap);
        await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${configuredSite.replace(/\/$/, "")}/sitemap.xml\n`);
      }
    },
  };
}

export default defineConfig({ plugins: [staticSeoPages()], server: { host: "0.0.0.0", port: 5181, proxy: { "/api": { target: "https://home-decor-0rfj.onrender.com", changeOrigin: true, secure: true } } }, build: { outDir: "dist", assetsInlineLimit: 4096 } });
