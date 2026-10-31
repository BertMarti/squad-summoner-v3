// Comprobación del CI: Puppeteer (vía whatsapp-web.js) descarga Chrome con @puppeteer/browsers 3 (override en
// package.json) y lo arranca. No abre WhatsApp ni toca la red salvo la página en blanco local.
'use strict';
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto('data:text/html,<title>ok</title>');
    const title = await page.title();
    if (title !== 'ok') throw new Error(`Título inesperado: ${title}`);
    console.log(`✅ Chrome descargado y arrancado: ${await browser.version()}`);
  } finally {
    await browser.close();
  }
  require('whatsapp-web.js');
  console.log('✅ whatsapp-web.js se carga');
})().catch((error) => {
  console.error('❌', error);
  process.exit(1);
});
