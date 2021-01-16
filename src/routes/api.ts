import { Router } from 'express';

import fetch from 'node-fetch';
import stopword from 'stopword';
import puppeteer from 'puppeteer';
import normalize from 'normalize-url';

const cache = new Map();

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('/scrape', async (req, res) => {
      try {
        const url: string = req.body.url ?? req.query.url;
        const response = await fetch(normalize(url));

        if (!response.ok) return res.boom.badRequest('Not able to find page');

        if (cache.has(url)) {
          const content = cache.get(url);
          return res.json({
            statusCode: 200,
            length: content.length,
            cache: true,
            content,
          });
        }

        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(normalize(url), { waitUntil: 'networkidle2' });
        const raw = await page.evaluate((el) => el.innerText, await page.$('body'));
        const content = stopword
          .removeStopwords(raw.split(' '))
          .join(' ')
          .replace(/[^a-zA-Z]/g, '')
          .toLowerCase();

        browser.close();

        cache.set(url, content);

        res.json({
          statusCode: 200,
          length: content.length,
          cache: false,
          content,
        });
      } catch (err) {
        res.boom.badRequest(err);
      }
    });

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
