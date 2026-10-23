const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844}});
    await context.route('https://*.supabase.co/**', route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','content-range':'*/0'},body:'[]'}));
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3013';
    await page.goto(base);
    const search = page.getByLabel('Elan axtar',{exact:true});
    for (const value of ['Suzuki motosiklet kirayəsi','Kostyum kirayəsi','Suzuki motosiklet kirayəsi']) {
      await search.fill(value);
      await page.getByRole('button',{name:'Elanları axtar →',exact:true}).click();
    }
    await page.reload();
    await page.locator('.searchHistory summary').click();
    assert.equal(await page.locator('.searchHistoryItems .secondary').count(),2);
    await page.getByRole('button',{name:'Suzuki motosiklet kirayəsi',exact:true}).click();
    assert.equal(await search.inputValue(),'Suzuki motosiklet kirayəsi');
    await page.getByRole('button',{name:'Tarixçəni təmizlə',exact:true}).click();
    assert.equal(await page.locator('.searchHistory').count(),0);
    await page.reload();
    assert.equal(await page.locator('.searchHistory').count(),0);
    // Storage disabled: searching remains usable, with in-memory history only.
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('storage disabled'); }; });
    await search.fill('Mənzil kirayəsi');
    await page.getByRole('button',{name:'Elanları axtar →',exact:true}).click();
    await page.locator('.searchHistory summary').waitFor();
    assert.deepEqual(errors,[]);
    await context.close();
    console.log('PASS mobile search history persists, deduplicates, reuses, clears and tolerates disabled storage');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
