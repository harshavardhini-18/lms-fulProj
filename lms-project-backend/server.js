import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeIndexes } from './models/index.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDB();

  if (process.env.SYNC_INDEXES === 'true') {
    await initializeIndexes();
    console.log('Indexes synchronized');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});