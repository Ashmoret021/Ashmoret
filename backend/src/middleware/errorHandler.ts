import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from './logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode =
    typeof err?.statusCode === 'number' ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error(`[${req.method}] ${req.originalUrl} - Error ${statusCode}: ${err?.message}`, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    stack: err?.stack,
  });

  res.status(statusCode).json({
    status: 'error',
    message: err?.message || 'Internal Server Error',
  });
};
