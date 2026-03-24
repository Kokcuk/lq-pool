export class InvalidParamError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidParamError';
  }
}

export class PoolNotFoundError extends Error {
  constructor(poolId) {
    super(`Pool not found: ${poolId}`);
    this.name = 'PoolNotFoundError';
  }
}

export class UpstreamError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'UpstreamError';
    this.cause = cause;
  }
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof InvalidParamError) {
    return res.status(400).json({ error: 'INVALID_PARAM', message: err.message });
  }
  if (err instanceof PoolNotFoundError) {
    return res.status(404).json({ error: 'POOL_NOT_FOUND', message: err.message });
  }
  if (err instanceof UpstreamError) {
    return res.status(502).json({ error: 'UPSTREAM_ERROR', message: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
