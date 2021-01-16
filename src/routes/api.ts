import { Router } from 'express';

import nlp from 'compromise';
import Sentiment from 'sentiment';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import stopword from 'stopword';
import normalize from 'normalize-url';
import susWords from '../utils/susWords';
import { bias } from '../utils/genderBias';

const cache = new Map();

export default {
  path: '/api/v1',
  action() {
    const router = new Router();
    const sentiment = new Sentiment();
    const susRE = new RegExp(`${susWords.join('|')}`, 'gim');

    router.get('/scrape', async (req, res) => {
      try {
        const url: string = req.body.url ?? req.query.url;
        const shouldCache: boolean = req.body.cache ?? req.query.cache ?? true;

        if (shouldCache && cache.has(url)) {
          return res.json(cache.get(url));
        }

        const response = await fetch(normalize(url));

        if (!response.ok) return res.boom.badRequest('Not able to find page');

        const $ = cheerio.load(await response.text());

        let content = $('body').text();
        // Remove unecessary fillter words
        content = stopword.removeStopwords(content.split(' ')).join(' ');
        // Remove non-alphabet
        content = content.replace(/[^a-zA-Z ]/gim, '');
        // Remove excessive spaces
        content = content.replace(/[ ]{2,}/gim, ' ');
        // Remove out of bound lengths
        content = content.length > 16 && content.length < 2147483647 ? content.toLowerCase() : null;

        const susMatches = content.match(susRE);
        const susMatchesAsRawString = susMatches.join('');
        const { score, comparative } = sentiment.analyze(content);

        const payload = {
          metrics: {
            preliminary: {
              numberOfSusWords: susMatches.length,
              numberOfSusCharacters: susMatchesAsRawString.length,
              totalNumberOfCharacters: content.length,
              percentageOfSusToTotal: (susMatchesAsRawString.length / content.length) * 100,
            },
            nlp: {
              sentimentData: { score, comparative },
              genderBias: bias(content).verdict
            },
          },
          content,
        };

        if (shouldCache) cache.set(url, payload);

        return res.json(payload);
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
