import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllIssuesFromAcc } from '../src/controllers/issuesController.js';

function issueRange(start, count) {
  return Array.from({ length: count }, (_, index) => ({ id: String(start + index) }));
}

test('issue pagination stops at the total reported by ACC', async () => {
  const offsets = [];
  const issues = await getAllIssuesFromAcc({
    accessToken: 'test-token',
    projectId: 'test-project',
    get: async (_url, options) => {
      const { offset, limit } = options.params;
      offsets.push(offset);
      return {
        data: {
          results: issueRange(offset, limit),
          pagination: { offset, limit, totalResults: 300 }
        }
      };
    }
  });

  assert.deepEqual(offsets, [0, 100, 200]);
  assert.equal(issues.length, 300);
});

test('issue pagination rejects a response without the ACC total', async () => {
  await assert.rejects(
    getAllIssuesFromAcc({
      accessToken: 'test-token',
      projectId: 'test-project',
      get: async () => ({ data: { results: issueRange(0, 100), pagination: {} } })
    }),
    /pagination\.totalResults/
  );
});

test('issue pagination retries a transient ACC gateway error at the same offset', async () => {
  const offsets = [];
  const delays = [];
  let failedOnce = false;

  const issues = await getAllIssuesFromAcc({
    accessToken: 'test-token',
    projectId: 'test-project',
    sleep: async (delayMs) => { delays.push(delayMs); },
    get: async (_url, options) => {
      const { offset, limit } = options.params;
      offsets.push(offset);

      if (offset === 100 && !failedOnce) {
        failedOnce = true;
        const error = new Error('Bad Gateway');
        error.response = { status: 502, headers: {} };
        throw error;
      }

      return {
        data: {
          results: issueRange(offset, limit),
          pagination: { offset, limit, totalResults: 300 }
        }
      };
    }
  });

  assert.deepEqual(offsets, [0, 100, 100, 200]);
  assert.equal(delays.length, 1);
  assert.equal(issues.length, 300);
});

test('issue pagination does not retry a non-transient ACC error', async () => {
  let requests = 0;

  await assert.rejects(
    getAllIssuesFromAcc({
      accessToken: 'test-token',
      projectId: 'test-project',
      sleep: async () => {},
      get: async () => {
        requests += 1;
        const error = new Error('Forbidden');
        error.response = { status: 403, headers: {} };
        throw error;
      }
    }),
    /Forbidden/
  );

  assert.equal(requests, 1);
});
