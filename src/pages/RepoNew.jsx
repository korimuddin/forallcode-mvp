import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FolderGit2 } from "lucide-react";
import RepoCreateForm from "../components/repo/RepoCreateForm";
import Hint from "../components/ui/Hint";
import { LimitBanner } from "../components/ui/LimitBanner";
import { useAuthSession, useDocumentTitle, useSignedInUserData } from "../lib/hooks";
import { createFeedEvent } from "../lib/createFeedEvent";
import { celebrate } from "../lib/celebrate";
import { isAtLimit } from "../lib/plans";
import { checkGitHubRepositoryAvailability, createGitHubRepository, supabase } from "../lib/supabase";
import { trackUsage } from "../lib/trackUsage";
import { useSubscription } from "../lib/useSubscription";

const REPO_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const initialForm = {
  owner: "",
  name: "",
  description: "",
  visibility: "public",
  templateId: "react",
  addReadme: true,
  addGitignore: true,
  gitignoreTemplate: "Node",
  addLicence: true,
  licenceId: "mit"
};

export default function RepoNew() {
  useDocumentTitle("Create a new repository");
  const navigate = useNavigate();
  const { session, checked, loggedIn } = useAuthSession();
  const { profile } = useSignedInUserData();
  const { planId } = useSubscription();
  const [form, setForm] = useState(initialForm);
  const [availability, setAvailability] = useState({ status: "idle", message: "" });
  const [privateRepoCount, setPrivateRepoCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("");

  const owner = profile?.username || session?.user?.user_metadata?.user_name || session?.user?.user_metadata?.preferred_username || "";
  const ownerOptions = useMemo(() => [owner || "owner"], [owner]);
  const privateRepoLimitReached = isAtLimit(planId, "privateRepos", privateRepoCount);
  const privateAtLimit = form.visibility === "private" && privateRepoLimitReached;
  const canCreate = form.name.trim()
    && REPO_NAME_PATTERN.test(form.name.trim())
    && availability.status !== "taken"
    && availability.status !== "invalid"
    && availability.status !== "checking"
    && !privateAtLimit
    && !creating;

  useEffect(() => {
    if (!form.owner && owner) {
      setForm((current) => ({ ...current, owner }));
    }
  }, [form.owner, owner]);

  useEffect(() => {
    let alive = true;

    async function loadPrivateRepoCount() {
      if (!supabase || !session?.user?.id) return;
      const { count } = await supabase
        .from("repositories")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", session.user.id)
        .eq("is_private", true);
      if (alive) setPrivateRepoCount(count || 0);
    }

    loadPrivateRepoCount();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  function updateForm(nextForm) {
    setForm(nextForm);
    setStatus("");
    if (nextForm.name !== form.name) {
      setAvailability({ status: "idle", message: "" });
    }
  }

  async function checkNameAvailability() {
    const name = form.name.trim();
    if (!name) {
      setAvailability({ status: "idle", message: "" });
      return;
    }

    if (!REPO_NAME_PATTERN.test(name)) {
      setAvailability({
        status: "invalid",
        message: "Use letters, numbers, hyphens, or underscores only."
      });
      return;
    }

    try {
      setAvailability({ status: "checking", message: "Checking GitHub..." });
      const result = await checkGitHubRepositoryAvailability(session, form.owner || owner, name);
      setAvailability({
        status: result.available ? "available" : "taken",
        message: result.message
      });
    } catch (error) {
      setAvailability({
        status: "invalid",
        message: error.message || "Could not check this repository name."
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!form.name.trim()) {
      setStatus("Add a repository name first.");
      return;
    }

    if (!REPO_NAME_PATTERN.test(form.name.trim())) {
      setAvailability({ status: "invalid", message: "Use letters, numbers, hyphens, or underscores only." });
      return;
    }

    if (privateAtLimit) {
      setStatus("You've reached the free private repo limit. Upgrade to Pro for unlimited private repositories.");
      return;
    }

    setCreating(true);

    try {
      if (availability.status !== "available") {
        const result = await checkGitHubRepositoryAvailability(session, form.owner || owner, form.name.trim());
        if (!result.available) {
          setAvailability({ status: "taken", message: result.message });
          return;
        }
      }

      const createdRepo = await createGitHubRepository(session, {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        usesGitHubInitializers: true
      });

      if (form.visibility === "private") {
        trackUsage(session?.user?.id, "private_repo_created", { repo_name: createdRepo.name }).catch(() => {});
      }
      if (form.visibility !== "private" && supabase && session?.user?.id) {
        const { data: storedRepo } = await supabase
          .from("repositories")
          .select("id")
          .eq("owner_id", session.user.id)
          .eq("name", createdRepo.name)
          .maybeSingle();
        createFeedEvent(supabase, {
          actorId: session.user.id,
          eventType: "repo_created",
          repoId: storedRepo?.id || null,
          metadata: { repo_name: createdRepo.name }
        }).catch(() => {});
      }

      celebrate();
      window.dispatchEvent(new CustomEvent("forallcode-toast", { detail: "Your first repo is live! 🎉 That's a real milestone." }));
      setStatus("Your first repo is live! 🎉 That's a real milestone.");
      window.setTimeout(() => navigate(`/${createdRepo.owner || form.owner}/${createdRepo.name}`), 650);
    } catch (error) {
      setStatus(error.message || "Could not create this repository.");
    } finally {
      setCreating(false);
    }
  }

  if (checked && !loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="repo-create-page page-frame">
      <header className="repo-create-header">
        <span className="eyebrow">New repo</span>
        <h1>Create a new <Hint term="repository">repository</Hint></h1>
        <p>Start a real GitHub <Hint term="repository">repository</Hint> with the ForAllCode comfort layer already wrapped around it.</p>
      </header>

      <section className="repo-create-shell">
        <div className="repo-create-card">
          <LimitBanner limitKey="privateRepos" currentCount={privateRepoCount} />
          <RepoCreateForm
            availability={availability}
            creating={creating}
            disabled={!canCreate}
            form={form}
            onBlurName={checkNameAvailability}
            onChange={updateForm}
            onSubmit={handleSubmit}
            ownerOptions={ownerOptions}
            privateRepoLimitReached={privateRepoLimitReached}
            status={status}
          />
          <Link className="repo-create-cancel" to="/repos">Cancel and go back to repositories</Link>
        </div>

        <aside className="repo-create-preview" aria-label="Repository creation preview">
          <FolderGit2 size={36} />
          <h2>{form.name || "my-warm-project"}</h2>
          <p>{form.description || "A short, welcoming description for contributors."}</p>
          <div>
            <span>{form.visibility}</span>
            {form.addReadme && <span>README</span>}
            {form.addGitignore && <span>{form.gitignoreTemplate} .gitignore</span>}
            {form.addLicence && form.licenceId !== "none" && <span>{form.licenceId.toUpperCase()} licence</span>}
          </div>
        </aside>
      </section>
    </div>
  );
}
