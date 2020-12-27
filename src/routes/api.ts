import { Router } from 'express';
import { getSubtitles } from 'youtube-captions-scraper';

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('/youtube', async (req, res) => {
      const videoID = req.query.id;
      const subtitles = await getSubtitles({ videoID });

      res.send(
        subtitles.reduce(
          (accumulator, currentSubtitle) =>
            `${accumulator} ${currentSubtitle.text}`,
          ''
        )
      );
    });

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
