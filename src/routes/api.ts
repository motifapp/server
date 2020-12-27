import { Router } from 'express';

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
