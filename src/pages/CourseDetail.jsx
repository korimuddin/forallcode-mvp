import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock, Star } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { renderMarkdown } from "../lib/markdownRenderer";
import { supabase } from "../lib/supabase";

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [purchaseState, setPurchaseState] = useState("default");
  const [error, setError] = useState("");
  useDocumentTitle(course?.title ? `${course.title} · Marketplace` : "Course");

  useEffect(() => {
    let alive = true;

    async function loadCourse() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const { data: userData } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(userData.user || null);

      const { data, error: courseError } = await supabase
        .from("marketplace_courses")
        .select("*, profiles(username, display_name, avatar_style, bio)")
        .eq("slug", slug)
        .maybeSingle();

      if (courseError) setError(courseError.message || "Could not load course.");
      if (!data || data.status !== "approved") {
        if (!alive) return;
        setCourse(null);
        setLoading(false);
        return;
      }

      const [{ data: lessonData }, { data: reviewData }] = await Promise.all([
        supabase.from("course_lessons").select("*").eq("course_id", data.id).order("sort_order"),
        supabase.from("course_reviews").select("*, profiles(username, display_name, avatar_style)").eq("course_id", data.id).order("created_at", { ascending: false })
      ]);

      let purchased = false;
      if (userData.user?.id) {
        const { data: purchase } = await supabase
          .from("course_purchases")
          .select("id")
          .eq("user_id", userData.user.id)
          .eq("course_id", data.id)
          .maybeSingle();
        purchased = Boolean(purchase?.id);
      }

      if (!alive) return;
      setCourse(data);
      setLessons(lessonData || []);
      setReviews(reviewData || []);
      setHasPurchased(purchased || searchParams.get("purchased") === "1");
      setLoading(false);
    }

    loadCourse();
    return () => {
      alive = false;
    };
  }, [searchParams, slug]);

  const previewLessons = lessons.filter((lesson) => lesson.is_free_preview);
  const rating = Number(course?.rating_avg || 0);
  const learningPoints = useMemo(() => (
    (course?.long_description || "")
      .split("\n")
      .filter((line) => line.trim().startsWith("- "))
      .slice(0, 5)
      .map((line) => line.replace(/^- /, "").trim())
  ), [course?.long_description]);

  async function handlePurchase() {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (hasPurchased) {
      setActiveTab("curriculum");
      return;
    }

    setPurchaseState("loading");
    setError("");
    const response = await fetch("/.netlify/functions/create-course-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        courseId: course.id,
        successUrl: `${window.location.origin}/marketplace/${course.slug}?purchased=1`,
        cancelUrl: `${window.location.origin}/marketplace/${course.slug}`
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      setError(payload.error || "Could not start checkout.");
      setPurchaseState("default");
      return;
    }
    window.location.href = payload.url;
  }

  if (loading) {
    return <div className="marketplace-page"><Skeleton className="marketplace-detail-skeleton" /></div>;
  }

  if (!course) return <Navigate to="/marketplace" replace />;

  return (
    <div className="marketplace-page">
      <section className="course-detail-hero">
        <div>
          <p className="eyebrow">Community course</p>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-detail-meta">
            <span>by @{course.profiles?.username || "forallcode"}</span>
            <span><Star size={14} />{rating.toFixed(1)}</span>
            <span>{course.student_count || 0} students</span>
          </div>
        </div>
        <aside className="course-purchase-card">
          <div
            className="course-purchase-cover"
            style={{ backgroundImage: course.cover_image_url ? `url("${course.cover_image_url}")` : undefined }}
          >
            {!course.cover_image_url && <BookOpen size={34} />}
          </div>
          <strong>£{Number(course.price_gbp || 0).toFixed(2)}</strong>
          <button className="button primary full" disabled={purchaseState === "loading"} onClick={handlePurchase} type="button">
            {hasPurchased ? "Open curriculum" : purchaseState === "loading" ? "Opening checkout..." : "Enrol now"}
          </button>
          {previewLessons.length > 0 && (
            <div className="course-preview-list">
              <span>Free previews</span>
              {previewLessons.map((lesson) => <small key={lesson.id}>{lesson.title}</small>)}
            </div>
          )}
        </aside>
      </section>

      {error && <p className="auth-error">{error}</p>}

      <div className="course-detail-tabs">
        {["overview", "curriculum", "reviews"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="course-detail-panel">
          <h2>Overview</h2>
          <div className="readme-render" dangerouslySetInnerHTML={{ __html: renderMarkdown(course.long_description || course.description || "") }} />
          <h3>What you will learn</h3>
          <div className="course-learn-grid">
            {(learningPoints.length ? learningPoints : ["Build practical confidence", "Understand the workflow", "Apply the lessons in real projects"]).map((item) => (
              <span key={item}><CheckCircle2 size={15} />{item}</span>
            ))}
          </div>
          <h3>About the author</h3>
          <p className="course-author-bio">{course.profiles?.bio || `${course.profiles?.display_name || course.profiles?.username || "This creator"} teaches through practical project examples.`}</p>
        </section>
      )}

      {activeTab === "curriculum" && (
        <section className="course-detail-panel">
          <h2>Curriculum</h2>
          <div className="course-lesson-list">
            {lessons.map((lesson, index) => (
              <article key={lesson.id}>
                <span>{index + 1}</span>
                <div>
                  <h3>{lesson.title}</h3>
                  <p><Clock size={13} />{lesson.duration_minutes || 10} min {lesson.is_free_preview && <b>Free preview</b>}</p>
                </div>
              </article>
            ))}
            {lessons.length === 0 && <p>No lessons have been added yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="course-detail-panel">
          <h2>Reviews</h2>
          <p className="course-rating-summary">{rating.toFixed(1)} average rating from {reviews.length} reviews.</p>
          <div className="course-review-list">
            {reviews.map((review) => (
              <article key={review.id}>
                <strong>{review.profiles?.display_name || review.profiles?.username || "Learner"}</strong>
                <span>{"★".repeat(review.rating)}</span>
                <p>{review.body}</p>
              </article>
            ))}
            {reviews.length === 0 && <p>No reviews yet.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
