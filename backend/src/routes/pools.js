import { Router } from 'express';
import { getPools } from '../services/poolService.js';
import { analyze } from '../services/analysisService.js';

export const poolRoutes = Router();

poolRoutes.get('/', async (req, res, next) => {
  try {
    const platforms = parseCommaSeparated(req.query.platform);
    const chains = parseCommaSeparated(req.query.chain);
    const minTvl = Number(req.query.minTvl ?? 100000);
    const minVolume = Number(req.query.minVolume ?? 10000);
    const sort = req.query.sort || 'score';
    const order = req.query.order || 'desc';
    const limit = parseInt(req.query.limit ?? '50', 10);
    const offset = parseInt(req.query.offset ?? '0', 10);

    const result = await getPools(platforms, chains, minTvl, minVolume, sort, order, limit, offset);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

poolRoutes.get('/:poolId/analysis', async (req, res, next) => {
  try {
    const poolId = req.params.poolId;
    const risk = parseInt(req.query.risk ?? '5', 10);
    const result = await analyze(poolId, risk);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

function parseCommaSeparated(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}
