import { Link } from "react-router-dom";

export default function EmptyState({ icon, title, body, actionLabel, onAction, to }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {(onAction || to) && (
        <Button onClick={onAction} to={to} variant="soft">{actionLabel}</Button>
      )}
    </div>
  );
}

function Button({ children, onClick, to, variant = "soft" }) {
  const className = `button ${variant}`;
  return to ? <Link className={className} to={to}>{children}</Link> : <button className={className} onClick={onClick} type="button">{children}</button>;
}
