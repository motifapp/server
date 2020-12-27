import { Router } from 'express';
import { getSubtitles } from 'youtube-captions-scraper';
import fillerWords from '../utils/fillerWords';

export default {
  path: '/api/v1',
  action() {
    const router = new Router();

    router.get('/youtube', async (req, res) => {
      const videoID = req.query.id;
      const stripFillers = req.query.strip;

      const subtitlesRaw = await getSubtitles({ videoID });
      let subtitles = subtitlesRaw.reduce(
        (accumulator, currentSubtitle) => `${accumulator} ${currentSubtitle.text}`,
        ''
      );

      if (stripFillers) {
        for (const word of fillerWords) {
          subtitles = subtitles.replace(new RegExp(`\\s${word}\\s`, 'gim'), ' ');
        }
      }

      res.json({ statusCode: 200, subtitles: subtitles.trim(), length: subtitlesRaw.length });
    });

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
