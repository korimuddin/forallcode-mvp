export default function BoardCard({ card, canEdit, onDragStart }) {
  return (
    <article
      className={canEdit ? "board-card draggable" : "board-card"}
      draggable={canEdit}
      onDragStart={(event) => onDragStart?.(event, card)}
    >
      {card.issue && (
        <div className="board-card-issue">
          #{card.issue.number} · <span className={card.issue.status === "open" ? "open" : "closed"}>{card.issue.status}</span>
        </div>
      )}
      <h3>{card.title}</h3>
      {card.body && <p>{card.body}</p>}
    </article>
  );
}
