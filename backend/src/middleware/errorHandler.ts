import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode =
    typeof err?.statusCode === 'number' ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    status: 'error',
    message: err?.message || 'Internal Server Error',
  });
};
