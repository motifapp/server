import { Express } from 'express';
import { join } from 'path';

// Middleware
import bodyParser from 'body-parser';
import boom from 'express-boom';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

// Routes
import api from './routes/api';
import normal from './routes/normal';

export const initializeMiddlewareAndRoutes = async (app: Express) => {
  app.enable('trust proxy');
  app.disable('view cache');

  app.set('view engine', 'eta');
  app.set('views', join(__dirname, '../views'));

  const middlewares = [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    boom(),
    cors({ origin: '*' }),
    compression(),
    morgan('dev'),
  ];

  const routes = [api, normal];

  for (const middleware of middlewares) {
    app.use(middleware);
  }

  for (const { path, action } of routes) {
    app.use(path, action());
  }
};

export default initializeMiddlewareAndRoutes;
