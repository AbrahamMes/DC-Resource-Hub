import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../scripts/acc-discovery.js';

test('ACC discovery pagination follows JSON API next links', async () => {
  const requested = [];
  const records = await paginate('https://example.test/page/1', async (url) => {
    requested.push(url);
    if (url.endsWith('/1')) {
      return { data: [{ id: 'one' }], links: { next: { href: '/page/2' } } };
    }
    return { data: [{ id: 'two' }], links: {} };
  });

  assert.deepEqual(records.map((record) => record.id), ['one', 'two']);
  assert.deepEqual(requested, ['https://example.test/page/1', 'https://example.test/page/2']);
});

test('ACC discovery pagination advances offset collections', async () => {
  const requested = [];
  const records = await paginate('https://example.test/items?limit=2&offset=0', async (url) => {
    requested.push(url);
    const offset = Number(new URL(url).searchParams.get('offset'));
    return {
      results: offset === 0 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }],
      pagination: { offset, limit: 2, totalResults: 3 }
    };
  });

  assert.deepEqual(records.map((record) => record.id), [1, 2, 3]);
  assert.equal(requested.length, 2);
});
