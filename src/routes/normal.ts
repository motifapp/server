import { Router } from 'express';

export const generateHeadConfig = (
  title: string,
  description: string,
  image: string,
  color: string
) => {
  return {
    title,
    description,
    image,
    color,
  };
};

export default {
  path: '/',
  action() {
    const router = new Router();

    router.get('/', (_req, res) => {
      res.render('index', generateHeadConfig('title', 'description', 'image', 'color'));
    });

    return router;
  },
};
