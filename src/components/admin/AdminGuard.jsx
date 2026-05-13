import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "../../lib/hooks";
import Skeleton from "../ui/Skeleton";

const ADMIN_USER_IDS = ["906e01d3-a655-4299-9269-437900cda4df"];

export function AdminGuard({ children }) {
  const { session, checked } = useAuthSession();
  const location = useLocation();

  if (!checked) {
    return (
      <div className="admin-guard-loading" aria-label="Checking admin access">
        <Skeleton className="route-skeleton-title" />
        <Skeleton className="route-skeleton-line" />
      </div>
    );
  }

  if (!session?.user || !ADMIN_USER_IDS.includes(session.user.id)) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  return children;
}
