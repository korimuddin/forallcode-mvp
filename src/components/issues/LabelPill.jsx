export const LABEL_STYLES = {
  bug: { bg: "#f5d5d8", color: "#72243E" },
  feature: { bg: "#ddd5f0", color: "#534AB7" },
  docs: { bg: "#cce0f0", color: "#0C447C" },
  question: { bg: "#f5e4c4", color: "#633806" },
  help: { bg: "#c8d8c4", color: "#27500A" }
};

export default function LabelPill({ label }) {
  if (!label) return null;
  const style = LABEL_STYLES[label] || { bg: "#f4efe6", color: "#6b5f58" };
  return (
    <span className="issue-label-pill" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}
