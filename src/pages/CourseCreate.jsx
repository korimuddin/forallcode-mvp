import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { createNotification } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const adminUserId = "906e01d3-a655-4299-9269-437900cda4df";

export default function CourseCreate() {
  useDocumentTitle("Create course");
  const navigate = useNavigate();
  const { session, checked } = useAuthSession();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("default");
  const [error, setError] = useState("");
  const [course, setCourse] = useState({
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    price: 10,
    coverImageUrl: ""
  });
  const [lessons, setLessons] = useState([
    { id: crypto.randomUUID(), title: "", duration: 10, body: "", freePreview: true }
  ]);

  const generatedSlug = useMemo(() => slugify(course.title), [course.title]);
  const finalSlug = course.slug || generatedSlug;

  if (checked && !session?.user) return <Navigate to="/login" replace />;

  function updateCourse(key, value) {
    setCourse((current) => ({ ...current, [key]: value }));
  }

  function addLesson() {
    setLessons((current) => [...current, { id: crypto.randomUUID(), title: "", duration: 10, body: "", freePreview: false }]);
  }

  function updateLesson(id, key, value) {
    setLessons((current) => current.map((lesson) => lesson.id === id ? { ...lesson, [key]: value } : lesson));
  }

  function removeLesson(id) {
    setLessons((current) => current.length === 1 ? current : current.filter((lesson) => lesson.id !== id));
  }

  async function submitCourse() {
    if (!session?.user?.id || !supabase) return;
    setStatus("saving");
    setError("");

    const price = Number(course.price);
    if (!course.title.trim() || !finalSlug || !course.description.trim() || price < 5 || price > 99) {
      setError("Add a title, slug, description, and a price between £5 and £99.");
      setStatus("default");
      return;
    }

    const validLessons = lessons.filter((lesson) => lesson.title.trim());
    if (validLessons.length === 0) {
      setError("Add at least one lesson title.");
      setStatus("default");
      return;
    }

    const { data: inserted, error: courseError } = await supabase
      .from("marketplace_courses")
      .insert({
        author_id: session.user.id,
        title: course.title.trim(),
        slug: finalSlug,
        description: course.description.trim(),
        long_description: course.longDescription.trim(),
        price_gbp: price,
        cover_image_url: course.coverImageUrl.trim() || null,
        lesson_count: validLessons.length,
        status: "pending_review"
      })
      .select("id, title")
      .single();

    if (courseError) {
      setError(courseError.message || "Could not submit course.");
      setStatus("default");
      return;
    }

    const lessonRows = validLessons.map((lesson, index) => ({
      course_id: inserted.id,
      title: lesson.title.trim(),
      body: lesson.body.trim(),
      duration_minutes: Number(lesson.duration || 10),
      is_free_preview: Boolean(lesson.freePreview),
      sort_order: index
    }));

    const { error: lessonError } = await supabase.from("course_lessons").insert(lessonRows);
    if (lessonError) {
      setError(lessonError.message || "Course created, but lessons could not be saved.");
      setStatus("default");
      return;
    }

    await createNotification(supabase, {
      userId: adminUserId,
      actorId: session.user.id,
      type: "course_submitted",
      message: `${course.title.trim()} was submitted for marketplace review`,
      metadata: { course_id: inserted.id, course_title: inserted.title }
    }).catch(() => {});

    setStatus("saved");
    navigate("/marketplace");
  }

  return (
    <div className="marketplace-page">
      <section className="course-create-shell">
        <header>
          <p className="eyebrow">Course marketplace</p>
          <h1>Create a course</h1>
          <p>Your course will be reviewed within 3 business days. You will be notified when it is approved or if changes are needed.</p>
        </header>

        <nav className="course-create-steps">
          {[1, 2, 3].map((item) => <button className={step === item ? "active" : ""} key={item} onClick={() => setStep(item)} type="button">Step {item}</button>)}
        </nav>

        {error && <p className="auth-error">{error}</p>}

        {step === 1 && (
          <div className="course-create-form">
            <label><span>Title</span><input value={course.title} onChange={(event) => updateCourse("title", event.target.value)} /></label>
            <label><span>Slug</span><input value={finalSlug} onChange={(event) => updateCourse("slug", slugify(event.target.value))} /><small>Your course will be at forallcode.netlify.app/marketplace/{finalSlug || "your-course"}</small></label>
            <label><span>Description</span><textarea rows="3" value={course.description} onChange={(event) => updateCourse("description", event.target.value)} /></label>
            <label><span>Long description</span><textarea rows="8" value={course.longDescription} onChange={(event) => updateCourse("longDescription", event.target.value)} /></label>
            <label><span>Price (£)</span><input min="5" max="99" type="number" value={course.price} onChange={(event) => updateCourse("price", event.target.value)} /></label>
            <label><span>Cover image URL</span><input value={course.coverImageUrl} onChange={(event) => updateCourse("coverImageUrl", event.target.value)} /></label>
          </div>
        )}

        {step === 2 && (
          <div className="course-lesson-editor">
            {lessons.map((lesson, index) => (
              <article key={lesson.id}>
                <div className="course-lesson-editor-head">
                  <strong>Lesson {index + 1}</strong>
                  <button onClick={() => removeLesson(lesson.id)} type="button"><Trash2 size={14} />Remove</button>
                </div>
                <label><span>Title</span><input value={lesson.title} onChange={(event) => updateLesson(lesson.id, "title", event.target.value)} /></label>
                <label><span>Duration minutes</span><input min="1" type="number" value={lesson.duration} onChange={(event) => updateLesson(lesson.id, "duration", event.target.value)} /></label>
                <label><span>Content</span><textarea rows="6" value={lesson.body} onChange={(event) => updateLesson(lesson.id, "body", event.target.value)} /></label>
                <label className="course-checkbox"><input checked={lesson.freePreview} onChange={(event) => updateLesson(lesson.id, "freePreview", event.target.checked)} type="checkbox" />Free preview</label>
              </article>
            ))}
            <button className="button soft" onClick={addLesson} type="button"><Plus size={15} />Add lesson</button>
          </div>
        )}

        {step === 3 && (
          <div className="course-review-submit">
            <div className="marketplace-course-card preview-only">
              <div className="marketplace-course-cover" style={{ backgroundImage: course.coverImageUrl ? `url("${course.coverImageUrl}")` : undefined }} />
              <div className="marketplace-course-body">
                <h3>{course.title || "Untitled course"}</h3>
                <p>{course.description || "Add a short description before submitting."}</p>
                <footer><span>{lessons.length} lessons</span><strong>£{Number(course.price || 0).toFixed(2)}</strong></footer>
              </div>
            </div>
            <button className="button primary" disabled={status === "saving"} onClick={submitCourse} type="button">{status === "saving" ? "Submitting..." : "Submit for review"}</button>
          </div>
        )}

        <footer className="course-create-actions">
          <button className="button soft" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button">Back</button>
          {step < 3 && <button className="button primary" onClick={() => setStep((current) => Math.min(3, current + 1))} type="button">Continue</button>}
        </footer>
      </section>
    </div>
  );
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
