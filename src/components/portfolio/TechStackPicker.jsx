import { Plus, X } from "lucide-react";
import { useState } from "react";

const suggestedTech = ["React", "Supabase", "JavaScript", "TypeScript", "CSS", "Node", "Vite", "Netlify"];

export default function TechStackPicker({ value = [], onChange }) {
  const [draft, setDraft] = useState("");
  const normalized = Array.isArray(value) ? value : [];

  function addTech(nextTech) {
    const tech = String(nextTech || draft).trim();
    if (!tech) return;
    if (!normalized.some((item) => item.toLowerCase() === tech.toLowerCase())) {
      onChange?.([...normalized, tech]);
    }
    setDraft("");
  }

  function removeTech(tech) {
    onChange?.(normalized.filter((item) => item !== tech));
  }

  return (
    <div className="tech-stack-picker">
      <div className="tech-stack-input-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTech();
            }
          }}
          placeholder="Add tech"
        />
        <button type="button" onClick={() => addTech()} aria-label="Add tech">
          <Plus size={15} />
        </button>
      </div>
      <div className="tech-stack-pills">
        {normalized.map((tech) => (
          <span key={tech}>
            {tech}
            <button type="button" onClick={() => removeTech(tech)} aria-label={`Remove ${tech}`}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="tech-stack-suggestions">
        {suggestedTech.filter((tech) => !normalized.includes(tech)).slice(0, 5).map((tech) => (
          <button key={tech} type="button" onClick={() => addTech(tech)}>{tech}</button>
        ))}
      </div>
    </div>
  );
}
