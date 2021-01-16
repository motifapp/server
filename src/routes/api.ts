import { Router } from 'express';

import cheerio from 'cheerio';
import fetch from 'node-fetch';
import stopword from 'stopword';
import normalize from 'normalize-url';

const cache = new Map();

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('/scrape', async (req, res) => {
      try {
        const url: string = req.body.url ?? req.query.url;

        if (cache.has(url)) {
          const content = cache.get(url);
          return res.json({ content });
        }

        const response = await fetch(normalize(url));

        if (!response.ok) return res.boom.badRequest('Not able to find page');

        const $ = cheerio.load(await response.text());

        let content = $('body').text();
        // Remove unecessary fillter words
        content = stopword.removeStopwords(content.split(' ')).join(' ');
        // Remove non-alphabet letters and lower
        content = content.replace(/[^a-zA-Z]/g, '').toLowerCase();
        // Remove
        content = content.length > 16 && content.length < 2147483647 ? content : null;

        cache.set(url, content);

        return res.json({ content });
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
