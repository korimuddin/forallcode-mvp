import { useMemo, useState } from "react";
import { Clock, X } from "lucide-react";
import { useLockIn } from "../../lib/useLockIn";

const DURATION_OPTIONS = [
  { label: "30 min", value: 0.5 },
  { label: "1 hr", value: 1 },
  { label: "2 hr", value: 2 },
  { label: "3 hr", value: 3 },
  { label: "4 hr", value: 4 }
];

const START_OPTIONS = [
  { id: "now", label: "Right now", sub: "Start immediately" },
  { id: "later", label: "Specific time", sub: "Schedule it" }
];

function defaultTime() {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function LockInDropdown({ onClose }) {
  const { startSession, pendingMessage } = useLockIn();
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [taskError, setTaskError] = useState(false);
  const [startMode, setStartMode] = useState("now");
  const [scheduledTime, setScheduledTime] = useState(defaultTime);

  const canStart = tasks.length > 0;
  const footerLabel = useMemo(() => (
    startMode === "now" ? "Lock in now" : "Lock in soon"
  ), [startMode]);

  function addTask() {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTasks((current) => [...current, trimmed]);
    setTaskInput("");
    setTaskError(false);
  }

  function removeTask(index) {
    setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));
  }

  function buildScheduledDate() {
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    return scheduledDate;
  }

  function handleActivate() {
    if (!canStart) {
      setTaskError(true);
      return;
    }

    startSession({
      durationHours: selectedDuration,
      tasks,
      scheduledFor: startMode === "later" ? buildScheduledDate().toISOString() : null
    });
    onClose();
  }

  return (
    <aside className="lockin-dropdown" aria-label="Set up lock-in mode">
      <div className="lockin-dropdown-header">
        <h2>Set up lock-in</h2>
        <button aria-label="Close lock-in setup" onClick={onClose} type="button"><X size={16} /></button>
      </div>

      {pendingMessage && <p className="lockin-pending-note">{pendingMessage}</p>}

      <section className="lockin-dropdown-section">
        <h3>How long are you locking in?</h3>
        <div className="lockin-duration-grid">
          {DURATION_OPTIONS.map((option) => (
            <button
              className={selectedDuration === option.value ? "selected" : ""}
              key={option.value}
              onClick={() => setSelectedDuration(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="lockin-dropdown-section">
        <h3>What will you complete?</h3>
        <div className="lockin-task-input">
          <input
            onChange={(event) => {
              setTaskInput(event.target.value);
              if (event.target.value.trim()) setTaskError(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTask();
              }
            }}
            placeholder="Name a task..."
            value={taskInput}
          />
          <button aria-label="Add task" onClick={addTask} type="button">+</button>
        </div>
        {tasks.length > 0 && (
          <div className="lockin-task-list">
            {tasks.map((task, index) => (
              <div className="lockin-task-pill" key={`${task}-${index}`}>
                <i />
                <span>{task}</span>
                <button aria-label={`Remove ${task}`} onClick={() => removeTask(index)} type="button">x</button>
              </div>
            ))}
          </div>
        )}
        {taskError && <p className="lockin-error">Add at least one task to lock in.</p>}
      </section>

      <section className="lockin-dropdown-section">
        <h3>When does it start?</h3>
        <div className="lockin-start-tabs">
          {START_OPTIONS.map((option) => (
            <button
              className={startMode === option.id ? "selected" : ""}
              key={option.id}
              onClick={() => setStartMode(option.id)}
              type="button"
            >
              <strong>{option.label}</strong>
              <span>{option.sub}</span>
            </button>
          ))}
        </div>
        {startMode === "later" && (
          <label className="lockin-time-picker">
            <Clock size={16} />
            <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} />
            <span>today</span>
          </label>
        )}
      </section>

      <div className={startMode === "later" ? "lockin-dropdown-footer split" : "lockin-dropdown-footer"}>
        <button className="lockin-primary-action" onClick={handleActivate} type="button">{footerLabel}</button>
        {startMode === "later" && <button className="lockin-secondary-action" onClick={onClose} type="button">Cancel</button>}
      </div>
    </aside>
  );
}
