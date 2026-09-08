import { test } from "node:test";
import assert from "node:assert/strict";
import auth from "../../netlify/functions/lib/auth.cjs";
import { getAssessment, publicQuestions, gradeAssessment } from "../../server/assessments/catalog.js";

test("authentication rejects missing and invalid bearer tokens", async () => {
  const handler = auth.authenticated(() => { throw new Error("must not run"); }, () => ({ auth: { getUser: async () => ({ error: new Error("invalid") }) } }));
  assert.equal((await handler({ httpMethod: "POST" })).statusCode, 401);
  assert.equal((await handler({ httpMethod: "POST", headers: { authorization: "Bearer invalid" } })).statusCode, 401);
  assert.equal((await handler({ httpMethod: "GET" })).statusCode, 405);
});

test("authenticated identity does not come from the request body", async () => {
  const handler = auth.authenticated(async (_event, user) => ({ statusCode: 200, body: user.id }), () => ({ auth: { getUser: async token => ({ data: { user: { id: token } } }) } }));
  const event = { httpMethod: "POST", headers: { Authorization: "Bearer verified-user" }, body: '{"userId":"victim"}' };
  assert.equal((await handler(event)).body, "verified-user");
  assert.equal((await handler({ ...event, body: "bad-json" })).statusCode, 400);
});

test("redirect URLs stay on the configured site", () => {
  assert.throws(() => auth.siteUrl("https://untrusted.example/"));
  assert.throws(() => auth.siteUrl("//untrusted.example/"));
  assert.ok(auth.siteUrl("/home").endsWith("/home"));
});

for (const type of ["git-fundamentals", "git-for-teams", "command-line-essentials", "open-source-contributor"]) {
  test(`${type}: server grades answers and hides answer keys`, () => {
    const assessment = getAssessment(type);
    const questions = publicQuestions(assessment);
    assert.ok(questions.length > 0);
    for (const question of questions) {
      assert.equal(Object.hasOwn(question, "correct"), false);
      assert.equal(Object.hasOwn(question, "explanation"), false);
    }
    assert.deepEqual(gradeAssessment(assessment, assessment.questions.map(q => q.correct)), { score: 100, passed: true });
    assert.deepEqual(gradeAssessment(assessment, questions.map(() => null)), { score: 0, passed: false });
    assert.throws(() => gradeAssessment(assessment, []));
    assert.throws(() => gradeAssessment(assessment, questions.map(() => 999)));
    assert.throws(() => gradeAssessment(assessment, questions.map(() => "0")));
  });
}

test("unknown assessment types are rejected", () => {
  assert.equal(getAssessment("__proto__"), null);
  assert.equal(getAssessment("unknown"), null);
});
