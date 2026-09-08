import auth from "./lib/auth.cjs";
import { getAssessment, gradeAssessment, publicQuestions } from "../../server/assessments/catalog.js";

const json = (statusCode, value) => ({ statusCode, body: JSON.stringify(value) });

export async function assessmentRequest(event, user, db) {
  const { action, certType, sessionId, answers } = JSON.parse(event.body);
  const assessment = getAssessment(certType);
  if (!assessment) return json(400, { error: "Unknown assessment." });
  if (action === "start") {
    const { data: cert, error } = await db.from("certifications").select("*")
      .eq("user_id", user.id).eq("cert_type", certType).maybeSingle();
    if (error) throw error;
    if (!cert?.stripe_payment_id || (cert.assessment_used && certType !== "git-fundamentals")) {
      return json(403, { error: "Purchase an assessment before starting." });
    }
    let { data: session, error: lookupError } = await db.from("assessment_sessions").select("*")
      .eq("user_id", user.id).eq("cert_type", certType).is("result", null).maybeSingle();
    if (lookupError) throw lookupError;
    if (!session) {
      const created = await db.from("assessment_sessions").insert({
        user_id: user.id, certificate_id: cert.id, cert_type: certType,
        payment_id: cert.stripe_payment_id,
        expires_at: new Date(Date.now() + assessment.minutes * 60_000).toISOString()
      }).select("*").single();
      if (created.error?.code === "23505") {
        const existing = await db.from("assessment_sessions").select("*")
          .eq("user_id", user.id).eq("cert_type", certType).is("result", null).single();
        if (existing.error) throw existing.error;
        session = existing.data;
      } else {
        if (created.error) throw created.error;
        session = created.data;
      }
    }
    return json(200, { sessionId: session.id, expiresAt: session.expires_at, questions: publicQuestions(assessment) });
  }
  if (action !== "submit" || typeof sessionId !== "string") return json(400, { error: "Invalid assessment request." });
  const { data: session, error } = await db.from("assessment_sessions").select("*")
    .eq("id", sessionId).eq("user_id", user.id).eq("cert_type", certType).maybeSingle();
  if (error) throw error;
  if (!session) return json(404, { error: "Assessment session not found." });
  if (session.result) return json(session.result.error ? 409 : 200, session.result);
  let grade;
  try { grade = gradeAssessment(assessment, answers); } catch { return json(400, { error: "Invalid answers." }); }
  const result = await db.rpc("finish_assessment", {
    session_id: session.id, calculated_score: grade.score, calculated_pass: grade.passed, submitted_answers: answers
  });
  if (result.error) throw result.error;
  return json(200, result.data);
}

export const handler = auth.authenticated(assessmentRequest);
