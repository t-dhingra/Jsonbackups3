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
    const journalMetricsUrl =
        'https://pubs.acs.org/pb-assets/json/journal_metrics.json';
    const oaJournalsUrl = 'https://pubs.acs.org/pb-assets/json/oaJournals.json';
    const relatedJournalsUrl =
        'https://pubs.acs.org/pb-assets/json/relatedJournals.json';
    const subjectInfoUrl =
        'https://pubs.acs.org/pb-assets/json/subject-info.json';
    const transformativeJournalsUrl =
        'https://pubs.acs.org/pb-assets/json/transformativeJournals.json';
    const coBrandedJournalsUrl =
        'https://pubs.acs.org/pb-assets/json/cobranded.json';

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
    let journalMetricsJson = await fetchJsonThroughPage(journalMetricsUrl);
    let oaJournalsJson = await fetchJsonThroughPage(oaJournalsUrl);
    let relatedJournalsJson = await fetchJsonThroughPage(relatedJournalsUrl);
    let subjectInfojson = await fetchJsonThroughPage(subjectInfoUrl);
    let transformativeJournalsJson = await fetchJsonThroughPage(
        transformativeJournalsUrl
    );
    let coBrandedJournalsJson = await fetchJsonThroughPage(
        coBrandedJournalsUrl
    );

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

        await page.goto(journalMetricsUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on journal_metrics page...');
        await new Promise((r) => setTimeout(r, 20000));
        journalMetricsJson = await page.evaluate(() => document.body.innerText);

        await page.goto(oaJournalsUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on journal-info page...');
        await new Promise((r) => setTimeout(r, 20000));
        oaJournalsJson = await page.evaluate(() => document.body.innerText);

        await page.goto(relatedJournalsUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on journal-info page...');
        await new Promise((r) => setTimeout(r, 20000));
        relatedJournalsJson = await page.evaluate(
            () => document.body.innerText
        );

        await page.goto(subjectInfoUrl, { waitUntil: 'networkidle0' });
        console.log('Waiting another 20 seconds on journal-info page...');
        await new Promise((r) => setTimeout(r, 20000));
        subjectInfojson = await page.evaluate(() => document.body.innerText);

        await page.goto(transformativeJournalsUrl, {
            waitUntil: 'networkidle0',
        });
        console.log('Waiting another 20 seconds on journal-info page...');
        await new Promise((r) => setTimeout(r, 20000));
        transformativeJournalsJson = await page.evaluate(
            () => document.body.innerText
        );
    }

    fs.mkdirSync('json', { recursive: true });
    fs.writeFileSync('json/vi_collection.json', viCollectionJson || '');
    fs.writeFileSync('json/journal-info.json', journalInfoJson || '');
    fs.writeFileSync('json/journal_metrics.json', journalMetricsJson || '');
    fs.writeFileSync('json/oaJournals.json', oaJournalsJson || '');
    fs.writeFileSync('json/relatedJournals.json', relatedJournalsJson || '');
    fs.writeFileSync('json/subject-info.json', subjectInfojson || '');
    fs.writeFileSync(
        'json/transformativeJournals.json',
        transformativeJournalsJson || ''
    );
    fs.writeFileSync(
        'json/coBrandedJournals.json',
        coBrandedJournalsJson || ''
    );

    await browser.close();

    if (isHtmlChallenge(viCollectionJson)) {
        console.log('vi_collection.json is still returning a challenge page.');
    }
    if (isHtmlChallenge(journalInfoJson)) {
        console.log('journal-info.json is still returning a challenge page.');
    }
    if (isHtmlChallenge(journalMetricsJson)) {
        console.log(
            'journal_metrics.json is still returning a challenge page.'
        );
    }
    if (isHtmlChallenge(oaJournalsJson)) {
        console.log('oaJournals.json is still returning a challenge page.');
    }
    if (isHtmlChallenge(relatedJournalsJson)) {
        console.log(
            'relatedJournals.json is still returning a challenge page.'
        );
    }
    if (isHtmlChallenge(subjectInfojson)) {
        console.log('subject-info.json is still returning a challenge page.');
    }
    if (isHtmlChallenge(transformativeJournalsJson)) {
        console.log(
            'transformativeJournals.json is still returning a challenge page.'
        );
    }
    if (isHtmlChallenge(coBrandedJournalsJson)) {
        console.log(
            'coBrandedJournals.json is still returning a challenge page.'
        );
    }
})();
