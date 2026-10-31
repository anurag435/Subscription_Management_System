import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(` Brightloop Subscription Server Running `);
      console.log(` Mode: ${ENV.NODE_ENV}`);
      console.log(` URL:  http://localhost:${ENV.PORT}`);
      console.log(`===============================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
