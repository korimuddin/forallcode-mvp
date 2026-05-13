import { useState } from "react";
import { X } from "lucide-react";

const SUGGESTIONS = ["react", "typescript", "cli", "api", "tool", "library", "game", "bot", "docs"];

function cleanTopic(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 35);
}

export default function TopicEditor({ onClose, onSave, topics = [] }) {
  const [draftTopics, setDraftTopics] = useState(topics);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  function addTopic(value = input) {
    const cleaned = cleanTopic(value);
    if (!cleaned) return;
    if (draftTopics.includes(cleaned)) {
      setMessage("That topic is already added.");
      return;
    }
    if (draftTopics.length >= 20) {
      setMessage("You can add up to 20 topics per repository.");
      return;
    }
    setDraftTopics((current) => [...current, cleaned]);
    setInput("");
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (input.trim()) {
      addTopic();
      return;
    }
    onSave(draftTopics);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="topic-editor-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add topics to help others discover your repository</h2>
        <label>
          Topic
          <input
            autoFocus
            maxLength={35}
            onChange={(event) => setInput(cleanTopic(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTopic();
              }
            }}
            placeholder="Add a topic..."
            value={input}
          />
        </label>
        <div className="topic-editor-chips">
          {draftTopics.map((topic) => (
            <button key={topic} onClick={() => setDraftTopics((current) => current.filter((item) => item !== topic))} type="button">
              {topic}<X size={13} />
            </button>
          ))}
          {draftTopics.length === 0 && <p>No topics yet.</p>}
        </div>
        <div className="topic-suggestions">
          <span>Suggestions:</span>
          {SUGGESTIONS.map((topic) => (
            <button disabled={draftTopics.includes(topic)} key={topic} onClick={() => addTopic(topic)} type="button">
              {topic}
            </button>
          ))}
        </div>
        {message && <p className="repo-create-status">{message}</p>}
        <div className="board-modal-actions">
          <button className="button soft" onClick={onClose} type="button">Cancel</button>
          <button className="button primary" type="submit">Save topics</button>
        </div>
      </form>
    </div>
  );
}
