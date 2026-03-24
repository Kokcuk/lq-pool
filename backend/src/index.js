import express from 'express';
import cors from 'cors';
import { platformRoutes } from './routes/platforms.js';
import { poolRoutes } from './routes/pools.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

app.use('/api/platforms', platformRoutes);
app.use('/api/pools', poolRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`LQ-Pool backend listening on http://localhost:${PORT}`);
});
