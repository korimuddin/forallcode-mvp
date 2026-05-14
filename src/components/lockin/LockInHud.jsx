import { Pause, Play, X } from "lucide-react";
import { useLockIn } from "../../lib/useLockIn";

function formatDigitalTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);
  const minutesAfterHours = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutesAfterHours).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function LockInHud() {
  const { currentTask, endSession, isPaused, remainingCount, session, taskSecondsLeft, togglePause } = useLockIn();
  const durationHours = session?.durationHours || 0;

  return (
    <div className="lockin-hud" role="timer" aria-label="Lock-in task countdown">
      <button className="lockin-hud-button" onClick={togglePause} type="button" aria-label={isPaused ? "Resume lock-in timer" : "Pause lock-in timer"}>
        {isPaused ? <Play size={18} /> : <Pause size={18} />}
      </button>
      <div className="lockin-digital-clock">
        <strong>{formatDigitalTime(taskSecondsLeft)}</strong>
        <span>{isPaused ? "Paused" : currentTask?.label || "Current task"}</span>
      </div>
      <button className="lockin-hud-button exit" onClick={() => endSession("abandoned")} type="button" aria-label="Exit lock-in mode">
        <X size={20} />
      </button>
      <div className="lockin-hud-copy">
        <strong>You are locked in</strong>
        <span>{durationHours} hour{durationHours !== 1 ? "s" : ""} · {remainingCount} task{remainingCount !== 1 ? "s" : ""} remaining</span>
      </div>
    </div>
  );
}
