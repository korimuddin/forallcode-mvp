import { useState } from "react";

const COLUMN_COLOURS = ["#f4efe6", "#ddd5f0", "#c8d8c4", "#cce0f0", "#f5d5d8", "#f5e4c4"];

export default function AddColumnModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [colour, setColour] = useState(COLUMN_COLOURS[0]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ name, colour });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="board-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add column</h2>
        <label>
          Column name
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ready for review" />
        </label>
        <div className="board-colour-picker" role="radiogroup" aria-label="Column colour">
          {COLUMN_COLOURS.map((item) => (
            <button
              aria-checked={colour === item}
              className={colour === item ? "active" : ""}
              key={item}
              onClick={() => setColour(item)}
              style={{ background: item }}
              type="button"
            />
          ))}
        </div>
        <div className="board-modal-actions">
          <button className="button soft" onClick={onClose} type="button">Cancel</button>
          <button className="button primary" disabled={!name.trim()} type="submit">Create column</button>
        </div>
      </form>
    </div>
  );
}
