import { MoreHorizontal, Plus } from "lucide-react";
import BoardCard from "./BoardCard";

export default function BoardColumn({
  canEdit,
  cards,
  column,
  onAddCard,
  onDragStart,
  onDrop,
  onEditColumn
}) {
  return (
    <section
      className="board-column"
      onDragOver={(event) => canEdit && event.preventDefault()}
      onDrop={(event) => onDrop?.(event, column)}
      style={{ background: column.colour || "#f4efe6" }}
    >
      <header>
        <span>{column.name}</span>
        <div>
          <small>{cards.length}</small>
          {canEdit && onEditColumn && (
            <button aria-label={`Edit ${column.name}`} onClick={() => onEditColumn?.(column)} type="button">
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="board-card-stack">
        {cards.map((card) => (
          <BoardCard card={card} canEdit={canEdit} key={card.id} onDragStart={onDragStart} />
        ))}
      </div>

      {canEdit && (
        <button className="board-add-card-button" onClick={() => onAddCard(column)} type="button">
          <Plus size={14} />Add card
        </button>
      )}
    </section>
  );
}
