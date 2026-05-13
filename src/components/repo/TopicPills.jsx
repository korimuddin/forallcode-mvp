import { Link } from "react-router-dom";

export default function TopicPills({ editable = false, onEdit, topics = [] }) {
  if (!topics.length && !editable) return null;

  return (
    <div className="repo-topic-pills">
      {topics.map((topic) => (
        <Link key={topic} to={`/explore?topic=${encodeURIComponent(topic)}`}>
          {topic}
        </Link>
      ))}
      {editable && (
        <button onClick={onEdit} type="button">
          {topics.length ? "+ Edit topics" : "+ Add topics"}
        </button>
      )}
    </div>
  );
}
