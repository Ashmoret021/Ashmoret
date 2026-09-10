import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import app from './app';
import { logger } from './middleware/logger';
import { initializeDatabase } from './config/db';

const normalizePort = (val: string): number | string | false => {
  const parsedPort = parseInt(val, 10);

  if (isNaN(parsedPort)) {
    // named pipe
    return val;
  }

  if (parsedPort >= 0) {
    // port number
    return parsedPort;
  }

  return false;
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

const onError = (error: NodeJS.ErrnoException): void => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      logger.error('Unexpected server error', { error });
      throw error;
  }
};

const onListening = (): void => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
  logger.info(`Server is listening on ${bind}`);
};

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    const details = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    logger.error('Failed to initialize database before server startup', { error: details });
    console.error('DB init failed:', details);
    process.exit(1);
  }
};

void startServer();
