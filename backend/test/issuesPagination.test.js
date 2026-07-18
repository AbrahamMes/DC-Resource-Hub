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
