const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use puppeteer-extra plugin stealth
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    );

    console.log('Visiting main domain...');
    await page.goto('https://pubs.acs.org', { waitUntil: 'networkidle0' });

    console.log('Waiting 20 seconds to pass challenge...');
    // Instead of page.waitForTimeout(20000), use a manual timeout
    await new Promise((r) => setTimeout(r, 20000));

    const viCollectionUrl =
        'https://pubs.acs.org/pb-assets/json/vi_collection.json';
    const journalInfoUrl =
        'https://pubs.acs.org/pb-assets/json/journal-info.json';

    async function fetchJsonThroughPage(url) {
        console.log(`Fetching JSON from: ${url}`);
        return page.evaluate(async (fetchUrl) => {
            const resp = await fetch(fetchUrl, {
                headers: { Accept: 'application/json' },
            });
            return resp.text();
        }, url);
    }

    let viCollectionJson = await fetchJsonThroughPage(viCollectionUrl);
    let journalInfoJson = await fetchJsonThroughPage(journalInfoUrl);

    const isHtmlChallenge = (text) =>
        text && text.trim().startsWith('<!DOCTYPE html>');

    if (isHtmlChallenge(viCollectionJson) || isHtmlChallenge(journalInfoJson)) {
        console.log(
            'Still got HTML challenge. Trying direct navigation to the JSON URL...'
        );
        await page.goto(viCollectionUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on vi_collection page...');
        await new Promise((r) => setTimeout(r, 20000));
        viCollectionJson = await page.evaluate(() => document.body.innerText);

        await page.goto(journalInfoUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on journal-info page...');
        await new Promise((r) => setTimeout(r, 20000));
        journalInfoJson = await page.evaluate(() => document.body.innerText);
    }

    fs.mkdirSync('json', { recursive: true });
    fs.writeFileSync('json/vi_collection.json', viCollectionJson || '');
    fs.writeFileSync('json/journal-info.json', journalInfoJson || '');

    await browser.close();

    if (isHtmlChallenge(viCollectionJson)) {
        console.log(
            'vi_collection.json is still returning a challenge page. Consider more advanced approaches.'
        );
    }
    if (isHtmlChallenge(journalInfoJson)) {
        console.log(
            'journal-info.json is still returning a challenge page. Consider more advanced approaches.'
        );
    }
})();
