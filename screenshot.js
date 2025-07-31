const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'home.png', fullPage: true });
  const html = await page.content();
  fs.writeFileSync('dom.html', html);
  await browser.close();
})();