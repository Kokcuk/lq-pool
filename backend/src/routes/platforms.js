import { Router } from 'express';

export const platformRoutes = Router();

const PLATFORMS = [
  {
    id: 'uniswap-v3',
    name: 'Uniswap v3',
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'bsc', 'avalanche', 'celo', 'blast'],
  },
  {
    id: 'sushiswap-v3',
    name: 'SushiSwap v3',
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'bsc', 'avalanche', 'fantom'],
  },
  {
    id: 'pancakeswap-v3',
    name: 'PancakeSwap v3',
    chains: ['bsc', 'ethereum', 'arbitrum', 'base', 'zksync', 'polygon-zkevm', 'linea', 'opbnb'],
  },
];

platformRoutes.get('/', (req, res) => {
  res.json(PLATFORMS);
});
