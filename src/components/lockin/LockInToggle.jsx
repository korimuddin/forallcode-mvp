import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import LockInDropdown from "./LockInDropdown";
import { useLockIn } from "../../lib/useLockIn";

export function LockInToggle() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isActive, isPending, cancelPending } = useLockIn();
  const wrapperRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) setDropdownOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function handleToggle() {
    if (isActive) return;
    setDropdownOpen((current) => !current);
  }

  return (
    <div className="lockin-toggle-wrap" ref={wrapperRef}>
      <button
        aria-label="Toggle lock-in mode"
        className={`lockin-toggle ${isActive ? "active" : ""} ${dropdownOpen ? "open" : ""} ${isPending ? "pending" : ""}`}
        onClick={handleToggle}
        type="button"
      >
        <Zap size={14} />
        <span>{isActive ? "Locked in" : "Lock in"}</span>
        {isPending && <span className="lockin-scheduled-badge">Scheduled</span>}
        <i aria-hidden="true"><b /></i>
      </button>

      {isPending && !isActive && (
        <button className="lockin-cancel-scheduled" onClick={cancelPending} type="button">
          Cancel
        </button>
      )}

      {dropdownOpen && !isActive && (
        <LockInDropdown onClose={() => setDropdownOpen(false)} />
      )}
    </div>
  );
}
