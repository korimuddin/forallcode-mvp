export default function AdminSearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <input
      className="admin-search-bar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
    />
  );
}
