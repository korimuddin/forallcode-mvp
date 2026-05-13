import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Sparkles, Star } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

const categories = ["All", "Git", "DevOps", "Design", "JavaScript", "Open source"];
const pageSize = 9;

export default function Marketplace() {
  useDocumentTitle("Marketplace");
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadCourses() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const { data, error: loadError } = await supabase
        .from("marketplace_courses")
        .select("*, profiles(username, display_name, avatar_style)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (loadError) setError(loadError.message || "Could not load courses.");
      setCourses(data || []);
      setLoading(false);
    }

    loadCourses();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return courses.filter((course) => {
      const text = `${course.title} ${course.description} ${course.long_description}`.toLowerCase();
      const categoryMatch = category === "All" || text.includes(category.toLowerCase());
      const queryMatch = !term || text.includes(term) || course.profiles?.username?.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [category, courses, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleCourses = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [category, query]);

  return (
    <div className="marketplace-page">
      <section className="marketplace-hero">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Learn from the ForAllCode community</h1>
          <p>Practical courses from developers who teach with clarity, kindness, and real project context.</p>
        </div>
        <Link className="button primary" to="/marketplace/create"><Plus size={16} />Create a course</Link>
      </section>

      <section className="marketplace-filters">
        <div className="marketplace-category-pills">
          {categories.map((item) => (
            <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)} type="button">{item}</button>
          ))}
        </div>
        <label className="marketplace-search">
          <Search size={16} />
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search courses" value={query} />
        </label>
      </section>

      {error && <p className="auth-error">{error}</p>}
      {loading ? (
        <div className="marketplace-grid">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton className="marketplace-skeleton" key={index} />)}
        </div>
      ) : visibleCourses.length ? (
        <>
          <div className="marketplace-grid">
            {visibleCourses.map((course) => <CourseCard course={course} key={course.id} />)}
          </div>
          {totalPages > 1 && (
            <nav className="marketplace-pagination" aria-label="Marketplace pages">
              <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Previous</button>
              <span>{page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">Next</button>
            </nav>
          )}
        </>
      ) : (
        <section className="marketplace-empty">
          <Sparkles size={26} />
          <h2>No approved courses yet</h2>
          <p>Courses submitted by the community will appear here after admin review.</p>
          <Link className="button soft" to="/marketplace/create">Submit the first course</Link>
        </section>
      )}
    </div>
  );
}

function CourseCard({ course }) {
  const rating = Number(course.rating_avg || 0);
  return (
    <Link className="marketplace-course-card" to={`/marketplace/${course.slug}`}>
      <div
        className="marketplace-course-cover"
        style={{
          backgroundImage: course.cover_image_url
            ? `linear-gradient(135deg, rgba(61,53,48,.2), rgba(155,143,212,.18)), url("${course.cover_image_url}")`
            : undefined
        }}
      >
        {!course.cover_image_url && <BookOpen size={38} />}
      </div>
      <div className="marketplace-course-body">
        <h3>{course.title}</h3>
        <p className="marketplace-course-author">by @{course.profiles?.username || "forallcode"}</p>
        <p>{course.description || "A ForAllCode community course."}</p>
        <footer>
          <span><Star size={13} />{rating.toFixed(1)} ({course.student_count || 0} students)</span>
          <strong>£{Number(course.price_gbp || 0).toFixed(2)}</strong>
        </footer>
      </div>
    </Link>
  );
}
