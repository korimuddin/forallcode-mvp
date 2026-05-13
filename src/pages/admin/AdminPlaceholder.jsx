import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { useDocumentTitle } from "../../lib/hooks";

export default function AdminPlaceholder({ title, subtitle }) {
  useDocumentTitle(`${title} admin · ForAllCode`);

  return (
    <div className="admin-placeholder-page">
      <AdminPageHeader title={title} subtitle={subtitle} />
      <div className="admin-placeholder-panel">
        <p className="eyebrow">Shell ready</p>
        <h2>{title}</h2>
        <p>This admin route is protected and ready for the page content in the next admin step.</p>
      </div>
    </div>
  );
}
