import { Router, Request, Response } from "express";
import { getMetaForRoute, generateSitemapXml } from "../services/seo.service.js";

const router = Router();

// 1. Dynamic XML Sitemap
router.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const xml = await generateSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour caching
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// 2. Robots.txt
router.get("/robots.txt", (req: Request, res: Response) => {
  const host = req.get("host") || "kishanvaani.in";
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Allow: /api/v1/seo/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours caching
  res.send(robots);
});

// 3. Dynamic Meta Endpoint for Client-Side SPA / Router
router.get("/api/v1/seo/meta", async (req: Request, res: Response) => {
  try {
    const pathQuery = req.query.path ? String(req.query.path) : "/";
    const meta = await getMetaForRoute(pathQuery);
    res.json({ success: true, meta });
  } catch (error) {
    console.error("SEO meta route error:", error);
    res.status(500).json({ error: "Failed to generate metadata" });
  }
});

// 4. Dedicated WhatsApp / Social Link Preview Handler: /share/slug/:slug
router.get("/share/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const meta = await getMetaForRoute(`/slug/${slug}`);

    // Pre-render lightweight semantic HTML page with Open Graph and auto-redirect for humans
    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">

  <!-- Open Graph / WhatsApp Preview -->
  <meta property="og:site_name" content="किसान वाणी | KishanVaani">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:image" content="${meta.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${meta.url}">
  <meta property="og:type" content="${meta.type}">
  ${meta.audioUrl ? `<meta property="og:audio" content="${meta.audioUrl}">` : ""}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${meta.image}">

  <!-- Human Redirect to Web App -->
  <meta http-equiv="refresh" content="0; url=${meta.url}">
</head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
  <h1>${escapeHtml(meta.title)}</h1>
  <p>${escapeHtml(meta.description)}</p>
  ${meta.audioUrl ? `<p>🎧 <a href="${meta.audioUrl}">ऑडियो सुनें (Listen Audio)</a></p>` : ""}
  <p><a href="${meta.url}">किसान वाणी ऐप में खोलें (Open in KishanVaani)...</a></p>
  <script>window.location.href = "${meta.url}";</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Share preview error:", error);
    res.redirect("/");
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default router;
