import express from 'express';
import config from './config';

import initializeMiddlewareAndRoutes from './init';

const app = express();

app.enable('trust proxy');
app.disable('view cache');

initializeMiddlewareAndRoutes(app);

app.listen(config.PORT, (err) => {
  if (err) throw new Error(err);
  return console.log(`Running on ${config.PORT}`);
});
