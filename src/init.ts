import { Express } from 'express';

// Middleware
import bodyParser from 'body-parser';
import boom from 'express-boom';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

// Routes
import api from './routes/api';

export const initializeMiddlewareAndRoutes = async (app: Express) => {
  app.enable('trust proxy');

  const middlewares = [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    boom(),
    cors({ origin: '*' }),
    compression(),
    morgan('dev'),
  ];

  const routes = [api];

  for (const middleware of middlewares) {
    app.use(middleware);
  }

  for (const { path, action } of routes) {
    app.use(path, action());
  }
};

export default initializeMiddlewareAndRoutes;
