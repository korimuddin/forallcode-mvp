import { useMemo, useState } from "react";

export default function AddCardModal({ issues = [], onClose, onSubmit, selectedColumn }) {
  const [tab, setTab] = useState("new");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [issueId, setIssueId] = useState("");

  const filteredIssues = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return issues.filter((issue) => {
      if (!normalized) return true;
      return issue.title.toLowerCase().includes(normalized) || String(issue.number).includes(normalized);
    });
  }, [issues, query]);

  function handleSubmit(event) {
    event.preventDefault();
    const linkedIssue = issues.find((issue) => issue.id === issueId) || null;
    onSubmit({
      body,
      issue: tab === "issue" ? linkedIssue : null,
      title: tab === "issue" ? linkedIssue?.title || "" : title
    });
  }

  const canSubmit = tab === "issue" ? Boolean(issueId) : Boolean(title.trim());

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="board-modal board-card-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add card to {selectedColumn?.name}</h2>
        <div className="board-modal-tabs">
          <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")} type="button">New card</button>
          <button className={tab === "issue" ? "active" : ""} onClick={() => setTab("issue")} type="button">Link existing issue</button>
        </div>

        {tab === "new" ? (
          <>
            <label>
              Title
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Draft onboarding notes" />
            </label>
            <label>
              Notes
              <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Optional context for this card." />
            </label>
          </>
        ) : (
          <>
            <label>
              Search open issues
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or number" />
            </label>
            <div className="board-issue-picker">
              {filteredIssues.map((issue) => (
                <label className={issueId === issue.id ? "active" : ""} key={issue.id}>
                  <input checked={issueId === issue.id} onChange={() => setIssueId(issue.id)} type="radio" />
                  <span>#{issue.number}</span>
                  <strong>{issue.title}</strong>
                </label>
              ))}
              {filteredIssues.length === 0 && <p>No open issues match that search.</p>}
            </div>
          </>
        )}

        <div className="board-modal-actions">
          <button className="button soft" onClick={onClose} type="button">Cancel</button>
          <button className="button primary" disabled={!canSubmit} type="submit">Add to board</button>
        </div>
      </form>
    </div>
  );
}
