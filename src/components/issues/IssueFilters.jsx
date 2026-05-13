const labels = ["bug", "feature", "docs", "question", "help"];

export default function IssueFilters({
  assignee,
  collaborators = [],
  label,
  onAssigneeChange,
  onLabelChange,
  onSearchChange,
  onSortChange,
  search,
  sort
}) {
  return (
    <div className="issue-filter-bar">
      <select aria-label="Filter by label" value={label} onChange={(event) => onLabelChange(event.target.value)}>
        <option value="all">All labels</option>
        {labels.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
      </select>
      <select aria-label="Filter by assignee" value={assignee} onChange={(event) => onAssigneeChange(event.target.value)}>
        <option value="anyone">Anyone</option>
        <option value="unassigned">Unassigned</option>
        {collaborators.map((item) => {
          const profile = item.profiles || {};
          return <option key={item.user_id || profile.id || profile.username} value={item.user_id}>{profile.username || profile.display_name}</option>;
        })}
      </select>
      <select aria-label="Sort issues" value={sort} onChange={(event) => onSortChange(event.target.value)}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="comments">Most commented</option>
        <option value="updated">Recently updated</option>
      </select>
      <input placeholder="Search issues..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
    </div>
  );
}
