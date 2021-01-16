import { Router } from 'express';
import { extract } from 'article-parser';

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('/scrape', async (req, res) => {
      const url = req.query.url;
      const page = await extract(url);

      res.json({ statusCode: 200, ...page });
    });

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
