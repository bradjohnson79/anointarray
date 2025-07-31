import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './screenshots';
const FILE_NAME = 'home.png';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  const filePath = path.join(OUTPUT_DIR, FILE_NAME);

  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 Screenshot saved to ${filePath}`);

  await browser.close();
})();