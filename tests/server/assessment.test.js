import { test } from "node:test";
import assert from "node:assert/strict";
import { assessmentRequest } from "../../netlify/functions/assessment.mjs";
import { getAssessment } from "../../server/assessments/catalog.js";

function database(data) {
  const filters = [];
  const query = {
    select() { return this; },
    eq(...args) { filters.push(args); return this; },
    maybeSingle: async () => ({ data })
  };
  return { filters, from: () => query };
}
const request = body => ({ body: JSON.stringify(body) });
const user = { id: "signed-in-user" };
const certType = "git-fundamentals";

test("starting an assessment requires a paid credential owned by the caller", async () => {
  const db = database(null);
  const response = await assessmentRequest(request({ action: "start", certType }), user, db);
  assert.equal(response.statusCode, 403);
  assert.ok(db.filters.some(([key, value]) => key === "user_id" && value === user.id));
});

test("submissions cannot read another user's assessment session", async () => {
  const db = database(null);
  const response = await assessmentRequest(request({ action: "submit", certType, sessionId: "other-session" }), user, db);
  assert.equal(response.statusCode, 404);
  assert.ok(db.filters.some(([key, value]) => key === "user_id" && value === user.id));
});

test("client-supplied grades are ignored", async () => {
  const db = database({ id: "owned-session" });
  let submitted;
  db.rpc = async (name, args) => {
    assert.equal(name, "finish_assessment");
    submitted = args;
    return { data: { score: args.calculated_score, passed: args.calculated_pass, attemptId: "attempt" } };
  };
  const response = await assessmentRequest(request({ action: "submit", certType, sessionId: "owned-session", score: 100, passed: true, answers: getAssessment(certType).questions.map(() => null) }), user, db);
  assert.equal(response.statusCode, 200);
  assert.equal(submitted.calculated_score, 0);
  assert.equal(submitted.calculated_pass, false);
});

test("duplicate submissions return the recorded outcome without grading twice", async () => {
  const result = { score: 80, passed: true, attemptId: "attempt" };
  const response = await assessmentRequest(request({ action: "submit", certType, sessionId: "owned-session" }), user, database({ result }));
  assert.deepEqual(JSON.parse(response.body), result);
});

test("replaced purchases produce a retryable conflict instead of a fake result", async () => {
  const response = await assessmentRequest(request({ action: "submit", certType, sessionId: "owned-session" }), user, database({ result: { error: "Purchase replaced" } }));
  assert.equal(response.statusCode, 409);
});
