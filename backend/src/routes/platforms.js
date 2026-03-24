import { Router } from 'express';

export const platformRoutes = Router();

const PLATFORMS = [
  {
    id: 'uniswap-v3',
    name: 'Uniswap v3',
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'bsc', 'avalanche', 'celo', 'blast'],
  },
];

platformRoutes.get('/', (req, res) => {
  res.json(PLATFORMS);
});
