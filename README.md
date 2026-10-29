# 24 Ethno Avenue

Static website (HTML / CSS / vanilla JS) — no build step.

## Publish on GitHub Pages
1. Upload the contents of this folder to the **root** of a GitHub repository (`index.html` must be in the root).
2. Repository → **Settings → Pages** → *Deploy from a branch* → branch `main`, folder `/ (root)` → Save.
3. After 1–2 minutes the site is live at `https://<username>.github.io/<repository>/`.

## Before going public (see TODO comments in the code)
- Replace `https://24ethnoavenue.ua` with the real domain in `canonical`, `og:url`, `og:image`, `robots.txt`, `sitemap.xml`.
- Add `images/og-image.jpg` (1200×630) and replace the placeholder favicons (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`).
- Replace placeholder phone / email / address on `contacts.html`.
- Connect real handlers for the forms and checkout (static hosting cannot process orders).
- Paste GA4 / Meta Pixel tags where marked in `<head>`.

Custom domain: Settings → Pages → Custom domain, then set DNS at your registrar.
