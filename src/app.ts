import express from 'express';
import mongoose from 'mongoose';
import config from './config';

import initializeMiddlewareAndRoutes from './initializeMiddlewareAndRoutes';

mongoose.connect(config.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const app = express();

app.enable('trust proxy');
app.disable('view cache');

initializeMiddlewareAndRoutes(app);

app.listen(config.PORT, (err) => {
  if (err) throw new Error(err);
  return console.log(`Running on ${config.PORT}`);
});
