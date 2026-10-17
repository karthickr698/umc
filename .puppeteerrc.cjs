// On Vercel, PDFs are rendered with @sparticuz/chromium, so skip Puppeteer's Chrome download.
module.exports = {
  skipDownload: Boolean(process.env.VERCEL),
};
