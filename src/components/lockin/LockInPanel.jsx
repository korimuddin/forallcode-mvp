import { Check, Zap } from "lucide-react";
import { useLockIn } from "../../lib/useLockIn";

export default function LockInPanel() {
  const { completeTask, remainingCount, session, tasks } = useLockIn();
  const durationHours = session?.durationHours || 0;

  return (
    <section className="lockin-panel" role="dialog" aria-modal="true" aria-label="Lock-in focus session">
      <div className="lockin-panel-icon"><Zap size={36} /></div>
      <h2>You are locked in</h2>
      <p className="lockin-panel-subtitle">
        {durationHours} hour{durationHours !== 1 ? "s" : ""} · {remainingCount} task{remainingCount !== 1 ? "s" : ""} remaining
      </p>

      <div className="lockin-checklist">
        {tasks.map((task) => (
          <div className={task.completed ? "complete" : ""} key={task.id}>
            <button
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              onClick={() => completeTask(task.id)}
              type="button"
            >
              {task.completed && <Check size={11} />}
            </button>
            <span>{task.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
