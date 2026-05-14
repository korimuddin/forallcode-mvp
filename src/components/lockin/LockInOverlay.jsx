import LockInHud from "./LockInHud";

export default function LockInOverlay() {
  return (
    <>
      <div className="lockin-spotlight-backdrop" aria-hidden="true">
        <span className="lockin-shade top" />
        <span className="lockin-shade left" />
        <span className="lockin-shade right" />
      </div>
      <LockInHud />
    </>
  );
}
