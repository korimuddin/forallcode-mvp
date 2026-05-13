import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AdminChart, { ADMIN_CHART_COLORS } from "../../components/admin/AdminChart";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;
const DATABASE_LIMIT_BYTES = 500 * 1024 * 1024;
const TABLES = [
  "profiles",
  "repositories",
  "workspace_notes",
  "workspace_todos",
  "learn_progress",
  "notifications",
  "subscriptions",
  "stars",
  "follows",
  "usage_events",
  "upgrade_feedback"
];

const ESTIMATED_ROW_BYTES = {
  profiles: 1800,
  repositories: 2500,
  workspace_notes: 1200,
  workspace_todos: 700,
  learn_progress: 350,
  notifications: 900,
  subscriptions: 900,
  stars: 180,
  follows: 180,
  usage_events: 850,
  upgrade_feedback: 1000
};

export default function AdminDataUsage() {
  useDocumentTitle("Data usage admin · ForAllCode");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowCounts, setRowCounts] = useState([]);
  const [heroFiles, setHeroFiles] = useState([]);
  const [uploadData, setUploadData] = useState([]);
  const [managementUsage, setManagementUsage] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadUsage() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [counts, files, uploads, management] = await Promise.all([
          Promise.all(TABLES.map(async (table) => {
            const { count, error: countError } = await supabase.from(table).select("*", { count: "exact", head: true });
            return {
              table,
              rows: countError ? 0 : count || 0,
              estimatedBytes: (countError ? 0 : count || 0) * (ESTIMATED_ROW_BYTES[table] || 800)
            };
          })),
          listHeroFiles(),
          supabase
            .from("usage_events")
            .select("created_at")
            .eq("event_type", "hero_image_uploaded")
            .gte("created_at", daysAgoIso(29))
            .limit(5000),
          fetchManagementUsage()
        ]);

        if (uploads.error) throw uploads.error;
        if (!alive) return;
        setRowCounts(counts);
        setHeroFiles(files);
        setUploadData(buildUploadData(uploads.data || []));
        setManagementUsage(management);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load data usage.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadUsage();
    return () => {
      alive = false;
    };
  }, []);

  const totalHeroBytes = heroFiles.reduce((sum, file) => sum + file.size, 0);
  const estimatedDatabaseBytes = rowCounts.reduce((sum, row) => sum + row.estimatedBytes, 0);
  const managementDatabaseBytes = findManagementBytes(managementUsage?.usage?.databaseContext);
  const databaseBytes = managementDatabaseBytes || estimatedDatabaseBytes;
  const apiRequestCount = getApiRequestCount(managementUsage?.usage?.apiRequestCount);
  const totalEstimatedBytes = totalHeroBytes + databaseBytes;
  const storagePercent = Math.min(100, Math.round((totalHeroBytes / STORAGE_LIMIT_BYTES) * 100));
  const databasePercent = Math.min(100, Math.round((databaseBytes / DATABASE_LIMIT_BYTES) * 100));

  const tableColumns = useMemo(() => ([
    { key: "table", label: "Table" },
    { key: "rows", label: "Rows", width: "120px" },
    {
      key: "estimatedBytes",
      label: "Estimated size",
      width: "160px",
      render: (value) => formatBytes(value)
    }
  ]), []);

  const fileColumns = useMemo(() => ([
    {
      key: "name",
      label: "File",
      render: (value, row) => (
        <div>
          <strong className="admin-table-primary">{value}</strong>
          <span className="admin-table-secondary">{row.path}</span>
        </div>
      )
    },
    {
      key: "owner",
      label: "Owner",
      width: "180px",
      render: (value) => <span className="admin-mono-value">{value || "Unknown"}</span>
    },
    {
      key: "size",
      label: "Size",
      width: "120px",
      render: (value) => formatBytes(value)
    },
    {
      key: "createdAt",
      label: "Uploaded",
      width: "160px",
      render: (value) => value ? new Date(value).toLocaleDateString("en-GB") : "Unknown"
    }
  ]), []);

  return (
    <div className="admin-data-page">
      <AdminPageHeader title="Data usage" subtitle="Storage, database rows, and Supabase free-tier signals." />
      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <div className="admin-overview-skeleton">
          <div className="admin-stat-grid">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="admin-skeleton-card" />)}
          </div>
          <Skeleton className="admin-skeleton-chart" />
        </div>
      ) : (
        <>
          <section className="admin-stat-grid">
            <StatCard label="Total estimated usage" value={formatBytes(totalEstimatedBytes)} accent="#9b8fd4" />
            <StatCard label="repo-heroes bucket" value={formatBytes(totalHeroBytes)} accent="#7aaa72" />
            <StatCard label={managementDatabaseBytes ? "Database size" : "Estimated database"} value={formatBytes(databaseBytes)} accent="#6aa8d4" />
            <StatCard label="API requests" value={apiRequestCount ?? "Not configured"} accent="#c8a055" />
          </section>

          <section className="admin-usage-grid">
            <UsageLimitCard
              label="Supabase storage"
              used={totalHeroBytes}
              limit={STORAGE_LIMIT_BYTES}
              percent={storagePercent}
            />
            <UsageLimitCard
              label="Estimated database"
              used={databaseBytes}
              limit={DATABASE_LIMIT_BYTES}
              percent={databasePercent}
            />
          </section>

          <section className="admin-management-card">
            <div>
              <h2>Supabase Management API</h2>
              <p>{managementUsage?.configured ? "Connected with server-side access." : "Not configured yet. Showing client-side estimates."}</p>
            </div>
            {managementUsage?.configured && (
              <div className="admin-management-grid">
                <span>Source: {managementUsage.source}</span>
                <span>Project: {managementUsage.projectRef}</span>
                <span>API usage samples: {managementUsage.usage?.apiCounts?.result?.length || 0}</span>
                <span>Storage config: {managementUsage.usage?.storageConfig ? "Available" : "Unavailable"}</span>
              </div>
            )}
            {!managementUsage?.configured && managementUsage?.message && <p className="admin-panel-muted">{managementUsage.message}</p>}
          </section>

          <section className="admin-course-grid">
            <div>
              <h2 className="admin-section-title">Database row counts</h2>
              <DataTable columns={tableColumns} data={rowCounts} emptyMessage="No table data found" />
            </div>
            <AdminChart title="Hero uploads" subtitle="Uploads per day over the last 30 days" height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={uploadData}>
                  <CartesianGrid stroke="#f4efe6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="uploads" fill={ADMIN_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChart>
          </section>

          <section>
            <h2 className="admin-section-title">Largest hero images</h2>
            <DataTable columns={fileColumns} data={heroFiles.slice(0, 20)} emptyMessage="No hero images found" />
          </section>

          <section className="admin-plan-reference">
            <h2>Supabase free-tier reference</h2>
            <div>
              <span>Storage: 500MB</span>
              <span>Database: 500MB</span>
              <span>Bandwidth: 5GB/month</span>
              <span>API requests: 500K/month</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function UsageLimitCard({ label, used, limit, percent }) {
  const status = percent >= 90 ? "alert" : percent >= 80 ? "warn" : "ok";

  return (
    <section className={`admin-usage-card ${status}`}>
      <div>
        <h2>{label}</h2>
        <p>{percent}% used ({formatBytes(used)} of {formatBytes(limit)})</p>
      </div>
      <div className="admin-usage-bar" aria-label={`${label} usage`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

async function listHeroFiles() {
  const ownerProfiles = await loadProfileOwnerMap();
  const { data: folders, error } = await supabase.storage.from("repo-heroes").list("", { limit: 100 });
  if (error) return [];

  const nestedFiles = await Promise.all((folders || []).map(async (folder) => {
    const ownerPrefix = folder.name;
    const { data: ownerEntries } = await supabase.storage.from("repo-heroes").list(ownerPrefix, { limit: 100 });
    const repoFolders = (ownerEntries || []).filter((entry) => !entry.name.includes("."));

    const repoFiles = await Promise.all(repoFolders.map(async (repoFolder) => {
      const pathPrefix = `${ownerPrefix}/${repoFolder.name}`;
      const { data: files } = await supabase.storage.from("repo-heroes").list(pathPrefix, {
        limit: 100,
        sortBy: { column: "updated_at", order: "desc" }
      });
      return (files || []).filter((file) => file.name.includes(".")).map((file) => ({
        name: file.name,
        path: `${pathPrefix}/${file.name}`,
        owner: ownerProfiles.get(ownerPrefix) || ownerPrefix,
        size: Number(file.metadata?.size || file.metadata?.contentLength || 0),
        createdAt: file.created_at || file.updated_at || file.last_accessed_at
      }));
    }));

    return repoFiles.flat();
  }));

  return nestedFiles.flat().sort((a, b) => b.size - a.size);
}

async function loadProfileOwnerMap() {
  const { data } = await supabase.from("profiles").select("id, username").limit(5000);
  return new Map((data || []).map((profile) => [profile.id, profile.username]));
}

function buildUploadData(rows) {
  const countsByDay = new Map();
  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  });

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      uploads: countsByDay.get(key) || 0
    };
  });
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

async function fetchManagementUsage() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

    const response = await fetch("/.netlify/functions/supabase-usage", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function getApiRequestCount(payload) {
  const first = payload?.result?.[0];
  if (!first) return null;
  if (typeof first.count === "number") return first.count;
  return null;
}

function findManagementBytes(payload) {
  const keys = new Set([
    "database_size_bytes",
    "db_size_bytes",
    "disk_size_bytes",
    "size_bytes",
    "total_size_bytes"
  ]);

  function walk(value) {
    if (!value || typeof value !== "object") return null;
    for (const [key, nested] of Object.entries(value)) {
      if (keys.has(key) && Number.isFinite(Number(nested))) return Number(nested);
      const found = walk(nested);
      if (found) return found;
    }
    return null;
  }

  return walk(payload);
}
