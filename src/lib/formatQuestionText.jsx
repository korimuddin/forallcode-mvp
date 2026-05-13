export function formatQuestionText(text) {
  const parts = String(text || "").split(/```([\s\S]*?)```/);

  return parts.flatMap((part, partIndex) => {
    if (partIndex % 2 === 1) {
      return (
        <pre className="cert-question-code" key={`block-${partIndex}`}>
          {part.trim()}
        </pre>
      );
    }

    return part.split(/`([^`]+)`/).map((item, itemIndex) => (
      itemIndex % 2 === 1
        ? <code className="cert-question-inline-code" key={`inline-${partIndex}-${itemIndex}`}>{item}</code>
        : item
    ));
  });
}
