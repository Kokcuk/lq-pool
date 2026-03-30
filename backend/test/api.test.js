const BASE = process.env.BASE_URL || 'http://localhost:8080';

let poolId = null;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

async function run() {
  console.log('\nGET /api/platforms');

  await test('returns 200 with array of 1 platform', async () => {
    const { status, body } = await get('/api/platforms');
    assert(status === 200, `expected 200, got ${status}`);
    assert(Array.isArray(body), 'expected array');
    assert(body.length === 1, `expected 1 platform, got ${body.length}`);
  });

  await test('each platform has id, name, chains', async () => {
    const { body } = await get('/api/platforms');
    for (const p of body) {
      assert(typeof p.id === 'string', 'missing id');
      assert(typeof p.name === 'string', 'missing name');
      assert(Array.isArray(p.chains), 'chains should be array');
      assert(p.chains.length > 0, 'chains should not be empty');
    }
  });

  await test('only contains uniswap-v3', async () => {
    const { body } = await get('/api/platforms');
    const ids = body.map(p => p.id);
    assert(ids.includes('uniswap-v3'), 'missing uniswap-v3');
    assert(ids.length === 1, `expected only 1 platform, got ${ids.length}`);
  });

  console.log('\nGET /api/pools');

  await test('returns 200 with pools and total', async () => {
    const { status, body } = await get('/api/pools?limit=5');
    assert(status === 200, `expected 200, got ${status}`);
    assert(typeof body.total === 'number', 'missing total');
    assert(Array.isArray(body.pools), 'missing pools array');
    assert(body.pools.length <= 5, `expected <= 5 pools, got ${body.pools.length}`);
    if (body.pools.length > 0) poolId = body.pools[0].id;
  });

  await test('pool objects have correct shape', async () => {
    const { body } = await get('/api/pools?limit=1');
    const p = body.pools[0];
    assert(p, 'no pools returned');
    assert(typeof p.id === 'string', 'missing id');
    assert(typeof p.platform === 'string', 'missing platform');
    assert(typeof p.chain === 'string', 'missing chain');
    assert(typeof p.token0 === 'object', 'missing token0');
    assert(typeof p.token0.symbol === 'string', 'missing token0.symbol');
    assert(typeof p.token1 === 'object', 'missing token1');
    assert(typeof p.token1.symbol === 'string', 'missing token1.symbol');
    assert(typeof p.feeTier === 'number', 'missing feeTier');
    assert(typeof p.tvl === 'number', 'missing tvl');
    assert(typeof p.volume24h === 'number', 'missing volume24h');
    assert(typeof p.feeApr === 'number', 'missing feeApr');
    assert(typeof p.score === 'number', 'missing score');
    assert(p.score >= 0 && p.score <= 100, `score ${p.score} out of range 0-100`);
  });

  await test('all pools are uniswap-v3', async () => {
    const { body } = await get('/api/pools?limit=20');
    for (const p of body.pools) {
      assert(p.platform === 'uniswap-v3', `expected uniswap-v3, got ${p.platform}`);
    }
  });

  await test('default sort is score desc', async () => {
    const { body } = await get('/api/pools?limit=10');
    for (let i = 1; i < body.pools.length; i++) {
      assert(body.pools[i - 1].score >= body.pools[i].score,
        `pools not sorted by score desc at index ${i}`);
    }
  });

  await test('sort by tvl asc works', async () => {
    const { body } = await get('/api/pools?sort=tvl&order=asc&limit=10');
    for (let i = 1; i < body.pools.length; i++) {
      assert(body.pools[i - 1].tvl <= body.pools[i].tvl,
        `pools not sorted by tvl asc at index ${i}`);
    }
  });

  await test('filter by chain works', async () => {
    const { body } = await get('/api/pools?chain=ethereum&limit=5');
    for (const p of body.pools) {
      assert(p.chain === 'ethereum', `expected ethereum, got ${p.chain}`);
    }
  });

  await test('pagination offset works', async () => {
    const { body: page1 } = await get('/api/pools?limit=2&offset=0');
    const { body: page2 } = await get('/api/pools?limit=2&offset=2');
    assert(page1.total === page2.total, 'totals should match');
    if (page1.pools.length > 0 && page2.pools.length > 0) {
      assert(page1.pools[0].id !== page2.pools[0].id, 'pages should have different pools');
    }
  });

  await test('invalid sort returns 400', async () => {
    const { status, body } = await get('/api/pools?sort=invalid');
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('invalid order returns 400', async () => {
    const { status, body } = await get('/api/pools?order=sideways');
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('limit out of range returns 400', async () => {
    const { status, body } = await get('/api/pools?limit=999');
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('negative offset returns 400', async () => {
    const { status, body } = await get('/api/pools?offset=-1');
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  console.log('\nGET /api/pools/:poolId/analysis');

  await test('returns 200 with analysis for valid pool', async () => {
    assert(poolId, 'no poolId captured from /api/pools — cannot test analysis');
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.poolId === poolId, `expected poolId ${poolId}, got ${body.poolId}`);
    assert(typeof body.currentPrice === 'number', 'missing currentPrice');
    assert(body.riskTolerance === 5, `expected riskTolerance 5, got ${body.riskTolerance}`);
    assert(typeof body.confidenceLevel === 'number', 'missing confidenceLevel');
    assert(body.confidenceLevel === 90, `risk 5 should give confidence 90, got ${body.confidenceLevel}`);
  });

  await test('priceWindow has correct shape', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    const pw = body.priceWindow;
    assert(pw, 'missing priceWindow');
    assert(typeof pw.lowerPrice === 'number', 'missing lowerPrice');
    assert(typeof pw.upperPrice === 'number', 'missing upperPrice');
    assert(typeof pw.spreadPercent === 'number', 'missing spreadPercent');
    assert(pw.lowerPrice < pw.upperPrice, 'lowerPrice should be < upperPrice');
  });

  await test('volatilityMetrics has correct shape', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    const vm = body.volatilityMetrics;
    assert(vm, 'missing volatilityMetrics');
    assert(typeof vm.stdDev1y === 'number', 'missing stdDev1y');
    assert(typeof vm.maxDrawdown1y === 'number', 'missing maxDrawdown1y');
    assert(typeof vm.percentInRange === 'number', 'missing percentInRange');
  });

  await test('priceHistory is array of {timestamp, price}', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    assert(Array.isArray(body.priceHistory), 'priceHistory should be array');
    assert(body.priceHistory.length > 0, 'priceHistory should not be empty');
    const pt = body.priceHistory[0];
    assert(typeof pt.timestamp === 'number', 'missing timestamp');
    assert(typeof pt.price === 'number', 'missing price');
  });

  await test('ilAtLower and ilAtUpper are negative numbers', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    assert(typeof body.ilAtLower === 'number', 'missing ilAtLower');
    assert(typeof body.ilAtUpper === 'number', 'missing ilAtUpper');
    assert(body.ilAtLower < 0, `ilAtLower should be negative, got ${body.ilAtLower}`);
    assert(body.ilAtUpper < 0, `ilAtUpper should be negative, got ${body.ilAtUpper}`);
  });

  await test('risk=1 gives wider window than risk=10', async () => {
    const [r1, r10] = await Promise.all([
      get(`/api/pools/${poolId}/analysis?risk=1`),
      get(`/api/pools/${poolId}/analysis?risk=10`),
    ]);
    assert(r1.body.priceWindow.spreadPercent > r10.body.priceWindow.spreadPercent,
      `risk=1 spread (${r1.body.priceWindow.spreadPercent}) should be > risk=10 spread (${r10.body.priceWindow.spreadPercent})`);
  });

  await test('no returns when deposit is not provided', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5`);
    assert(body.returns === undefined, 'returns should not be present without deposit');
  });

  await test('returns present when deposit is provided', async () => {
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=5&deposit=10000`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.returns, 'missing returns');
    assert(body.returns.deposit === 10000, `expected deposit 10000, got ${body.returns.deposit}`);
  });

  await test('returns has historical and projected breakdowns', async () => {
    const { body } = await get(`/api/pools/${poolId}/analysis?risk=5&deposit=10000`);
    const r = body.returns;
    for (const type of ['historical', 'projected']) {
      assert(r[type], `missing returns.${type}`);
      for (const period of ['daily', 'weekly', 'monthly', 'yearly']) {
        const p = r[type][period];
        assert(p, `missing returns.${type}.${period}`);
        assert(typeof p.feeIncome === 'number', `missing ${type}.${period}.feeIncome`);
        assert(typeof p.ilCost === 'number', `missing ${type}.${period}.ilCost`);
        assert(typeof p.netReturn === 'number', `missing ${type}.${period}.netReturn`);
        assert(typeof p.netReturnPercent === 'number', `missing ${type}.${period}.netReturnPercent`);
      }
    }
  });

  await test('projected yearly feeIncome scales with deposit', async () => {
    const [r1, r2] = await Promise.all([
      get(`/api/pools/${poolId}/analysis?risk=5&deposit=10000`),
      get(`/api/pools/${poolId}/analysis?risk=5&deposit=20000`),
    ]);
    const fee1 = r1.body.returns.projected.yearly.feeIncome;
    const fee2 = r2.body.returns.projected.yearly.feeIncome;
    const ratio = fee2 / fee1;
    assert(ratio > 1.9 && ratio < 2.1, `doubling deposit should ~double fees, got ratio ${ratio}`);
  });

  await test('deposit <= 0 returns 400', async () => {
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=5&deposit=0`);
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('negative deposit returns 400', async () => {
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=5&deposit=-100`);
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('risk out of range returns 400', async () => {
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=0`);
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('risk=11 returns 400', async () => {
    const { status, body } = await get(`/api/pools/${poolId}/analysis?risk=11`);
    assert(status === 400, `expected 400, got ${status}`);
    assert(body.error === 'INVALID_PARAM', `expected INVALID_PARAM, got ${body.error}`);
  });

  await test('unknown poolId returns 404', async () => {
    const { status, body } = await get('/api/pools/nonexistent-pool-id/analysis');
    assert(status === 404, `expected 404, got ${status}`);
    assert(body.error === 'POOL_NOT_FOUND', `expected POOL_NOT_FOUND, got ${body.error}`);
  });

  console.log('');
}

run();
