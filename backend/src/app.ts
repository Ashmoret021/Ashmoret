import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import logger from 'morgan';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(logger('dev'));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', healthRouter);

app.use(errorHandler);

export default app;
