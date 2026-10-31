import prisma from "../prisma.js";

const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&auto=format&fit=crop&q=80";
const SITE_NAME = "किसान वाणी | KishanVaani";
const BASE_URL = process.env.BASE_URL || process.env.FRONTEND_URL || "https://kishanvaani.in";

export interface PageMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article" | "audio";
  audioUrl?: string;
  author?: string;
  publishedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, any>;
}

export async function getMetaForRoute(urlPath: string): Promise<PageMeta> {
  const cleanPath = urlPath.split("?")[0].replace(/\/+$/, "") || "/";

  // 1. Article / Audio Broadcast by Slug: /slug/:slug or /content/:id
  const slugMatch = cleanPath.match(/^\/(?:slug|content)\/([a-zA-Z0-9_-]+)/);
  if (slugMatch) {
    const slugOrId = slugMatch[1];
    const item = await prisma.content.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        status: "PUBLISHED",
      },
      include: {
        audio: true,
        author: { select: { name: true } },
      },
    });

    if (item) {
      const title = `${item.title} — किसान वाणी`;
      const description =
        item.description ||
        item.body?.slice(0, 180).replace(/\s+/g, " ") ||
        "किसान वाणी पर ऑडियो कृषि सलाह और वैज्ञानिक निर्देश सुनें।";
      const image = item.thumbnailUrl || DEFAULT_OG_IMAGE;
      const canonicalUrl = `${BASE_URL}/slug/${item.slug}`;

      const jsonLd: any = {
        "@context": "https://schema.org",
        "@type": item.audio?.fileUrl ? "AudioObject" : "NewsArticle",
        headline: item.title,
        description,
        image: [image],
        datePublished: item.publishedAt?.toISOString() || item.createdAt.toISOString(),
        author: {
          "@type": "Person",
          name: item.author?.name || item.authorName || "KishanVaani Desk",
        },
        publisher: {
          "@type": "Organization",
          name: "KishanVaani",
          logo: {
            "@type": "ImageObject",
            url: `${BASE_URL}/icon.svg`,
          },
        },
      };

      if (item.audio?.fileUrl) {
        jsonLd.contentUrl = item.audio.fileUrl;
        jsonLd.duration = `PT${item.audio.durationSec || 180}S`;
      }

      return {
        title,
        description,
        image,
        url: canonicalUrl,
        type: item.audio?.fileUrl ? "audio" : "article",
        audioUrl: item.audio?.fileUrl,
        author: item.author?.name || item.authorName || "KishanVaani Desk",
        publishedTime: item.publishedAt?.toISOString(),
        tags: item.tags ? item.tags.split(",") : [item.category, item.type],
        jsonLd,
      };
    }
  }

  // 2. Mandi Prices Route: /mandi-prices
  if (cleanPath === "/mandi-prices") {
    return {
      title: "लाइव मंडी भाव व 100 किमी नजदीकी बाजार तुलना | Live Mandi Prices - KishanVaani",
      description:
        "Agmarknet और eNAM से गेहूं, धान, सरसों और कपास के ताजा मंडी भाव। परिवहन भाड़ा काटकर 50 क्विंटल ट्रक लोड पर शुद्ध लाभ जानें।",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
      url: `${BASE_URL}/mandi-prices`,
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Live Mandi Prices & 100km Net Realization",
        description: "Compare APMC mandi rates within 100km radius with automated freight deduction.",
      },
    };
  }

  // 3. Agriculture / Crop Calendar: /agriculture
  if (cleanPath === "/agriculture" || cleanPath === "/crop-calendar") {
    return {
      title: "पर्सनलाइज्ड फसल कैलेंडर और स्प्रे गाइड | Crop Calendar - KishanVaani",
      description:
        "जिले और फसल अनुसार 7-चरणीय वैज्ञानिक फसल चक्र। जानें बुवाई, खाद की मात्रा और बारिश से पहले सुरक्षित कीटनाशक स्प्रे विंडो।",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&auto=format&fit=crop&q=80",
      url: `${BASE_URL}/agriculture`,
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Personalised Agriculture Crop Calendar",
        description: "Scientific Days After Sowing timeline and IMD rainfall-aware spray safety alerts.",
      },
    };
  }

  // 4. Live Weather Route: /weather
  if (cleanPath === "/weather") {
    return {
      title: "मौसम पूर्वानुमान और कृषि स्प्रे सलाह | Live Weather & Spray Advisory - KishanVaani",
      description:
        "IMD और Open-Meteo आधारित 7-दिवसीय मौसम रिपोर्ट। जानें हवा की गति, आर्द्रता और फसलों पर छिड़काव के अनुकूल समय।",
      image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&auto=format&fit=crop&q=80",
      url: `${BASE_URL}/weather`,
      type: "website",
    };
  }

  // 5. Community & Agronomist Q&A: /community
  if (cleanPath.startsWith("/community")) {
    return {
      title: "किसान चौपाल और विशेषज्ञ सलाह | Farmer Community & Expert Answers - KishanVaani",
      description:
        "कृषि वैज्ञानिकों से सवाल पूछें, ऑडियो में उत्तर पाएं और साथी किसानों के सफलता के अनुभव सुनें।",
      image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1200&auto=format&fit=crop&q=80",
      url: `${BASE_URL}/community`,
      type: "website",
    };
  }

  // Default Home Page Meta
  return {
    title: "किसान वाणी | KishanVaani - आवाज से सशक्त किसान",
    description:
      "भारत का पहला ऑडियो-फर्स्ट कृषि और ग्रामीण मंच। ताजा मंडी भाव, फसल कैलेंडर, आईएमडी मौसम अलर्ट और कृषि विशेषज्ञों के प्रमाणित ऑडियो उत्तर।",
    image: DEFAULT_OG_IMAGE,
    url: BASE_URL,
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "KishanVaani",
      url: BASE_URL,
      applicationCategory: "AgricultureApplication",
      operatingSystem: "All",
    },
  };
}

export function injectMetaIntoHtml(html: string, meta: PageMeta): string {
  let updated = html;

  // Replace Title
  updated = updated.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);

  // Build Meta Tags Block
  const metaTags = `
    <!-- Dynamic Open Graph / WhatsApp Preview -->
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="og:type" content="${meta.type}" />
    ${meta.audioUrl ? `<meta property="og:audio" content="${meta.audioUrl}" />` : ""}
    ${meta.publishedTime ? `<meta property="article:published_time" content="${meta.publishedTime}" />` : ""}
    ${meta.author ? `<meta property="article:author" content="${escapeHtml(meta.author)}" />` : ""}

    <!-- Dynamic Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${meta.image}" />

    <!-- Canonical Link -->
    <link rel="canonical" href="${meta.url}" />

    <!-- Schema.org JSON-LD -->
    ${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ""}
  `;

  // Inject before </head>
  if (updated.includes("</head>")) {
    updated = updated.replace("</head>", `${metaTags}\n  </head>`);
  }

  return updated;
}

export async function generateSitemapXml(): Promise<string> {
  const publishedContent = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 500,
  });

  const staticUrls = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/mandi-prices`, priority: "0.9", changefreq: "hourly" },
    { loc: `${BASE_URL}/agriculture`, priority: "0.9", changefreq: "daily" },
    { loc: `${BASE_URL}/weather`, priority: "0.8", changefreq: "hourly" },
    { loc: `${BASE_URL}/community`, priority: "0.8", changefreq: "daily" },
    { loc: `${BASE_URL}/literature`, priority: "0.7", changefreq: "weekly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const s of staticUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${s.loc}</loc>\n`;
    xml += `    <changefreq>${s.changefreq}</changefreq>\n`;
    xml += `    <priority>${s.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const c of publishedContent) {
    const lastMod = (c.publishedAt || c.updatedAt).toISOString().split("T")[0];
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/slug/${c.slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default {
  getMetaForRoute,
  injectMetaIntoHtml,
  generateSitemapXml,
};
