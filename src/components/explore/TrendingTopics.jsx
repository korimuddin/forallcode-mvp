import { Link } from "react-router-dom";

export default function TrendingTopics({ topics = [], range = "week" }) {
  const maxCount = Math.max(1, ...topics.map((item) => item.count || 0));

  return (
    <section className="explore-discovery-panel">
      <div className="explore-section-heading">
        <p className="eyebrow">Topics</p>
        <span>Repos updated this {range === "month" ? "month" : "week"}</span>
      </div>
      <div className="trending-topic-cloud">
        {topics.map((item) => {
          const weight = (item.count || 0) / maxCount;
          return (
            <Link
              key={item.topic}
              style={{ fontSize: `${13 + Math.round(weight * 4)}px` }}
              to={`/explore?topic=${encodeURIComponent(item.topic)}`}
            >
              #{item.topic}
              <span>{item.count}</span>
            </Link>
          );
        })}
      </div>
      {topics.length === 0 && <p className="explore-empty">Topics will trend once public repositories add them.</p>}
    </section>
  );
}
