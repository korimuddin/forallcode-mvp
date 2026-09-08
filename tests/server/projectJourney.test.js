import assert from "node:assert/strict";
import { test } from "node:test";
import { firstProjectLessons, nextProjectLesson, parsePracticePullRequest, verifyPracticePullRequest } from "../../src/lib/projectJourney.js";

test("project lessons follow actual review progress", () => {
  assert.equal(nextProjectLesson(), "commits");
  assert.equal(nextProjectLesson(["commits", "unrelated"]), "branching");
  assert.equal(nextProjectLesson(firstProjectLessons), null);
});

test("practice rejects non-GitHub and malformed URLs before fetching", () => {
  for (const url of ["javascript:alert(1)", "https://evil.test/a/b/pull/1", "https://github.com.evil.test/a/b/pull/1", "https://github.com/a/b/issues/1", "https://token@github.com/a/b/pull/1"]) assert.throws(() => parsePracticePullRequest(url));
  assert.equal(parsePracticePullRequest("https://github.com/a/b/pull/12?tab=files").number, "12");
});

function fixture({ author = 42, files = [{ filename: "README.md", additions: 3, status: "modified" }], status = 200 } = {}) {
  return async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer fixture-token");
    assert.equal(options.method, undefined);
    return { ok: status === 200, status, json: async () => url.endsWith("/user") ? { id: 42 } : url.includes("/files?") ? files : { user: { id: author }, title: "Document setup", head: { sha: "a" }, base: { sha: "b" }, changed_files: 1, state: "open" } };
  };
}
test("practice confirms authorship and real README additions", async () => {
  const result = await verifyPracticePullRequest("https://github.com/a/b/pull/1", "fixture-token", fixture());
  assert.equal(result.title, "Document setup");
  await assert.rejects(verifyPracticePullRequest("https://github.com/a/b/pull/1", "fixture-token", fixture({ author: 99 })), /authored/);
  await assert.rejects(verifyPracticePullRequest("https://github.com/a/b/pull/1", "fixture-token", fixture({ files: [{ filename: "app.js", additions: 5 }] })), /README/);
  await assert.rejects(verifyPracticePullRequest("https://github.com/a/b/pull/1", "fixture-token", fixture({ files: [{ filename: "README.md", additions: 0, status: "removed" }] })), /README/);
});
test("practice gives actionable errors for missing access", async () => {
  await assert.rejects(verifyPracticePullRequest("https://github.com/a/b/pull/1", "", fixture()), /Reconnect/);
  await assert.rejects(verifyPracticePullRequest("https://github.com/a/b/pull/1", "fixture-token", fixture({ status: 404 })), /not found/);
});
