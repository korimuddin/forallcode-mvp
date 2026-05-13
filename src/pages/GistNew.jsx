import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { createEmptyGistFile, detectGistLanguage } from "../lib/gists";
import { useAuthSession, useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";

export default function GistNew() {
  useDocumentTitle("New gist");
  const navigate = useNavigate();
  const { checked, session, loggedIn } = useAuthSession();
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [files, setFiles] = useState([createEmptyGistFile(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateFile(index, field, value) {
    setFiles((current) => current.map((file, fileIndex) => {
      if (fileIndex !== index) return file;
      const nextFile = { ...file, [field]: value };
      if (field === "filename") nextFile.language = detectGistLanguage(value);
      return nextFile;
    }));
  }

  function addFile() {
    setFiles((current) => [...current, createEmptyGistFile(current.length)]);
  }

  function removeFile(index) {
    setFiles((current) => current.length === 1 ? current : current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    const cleanFiles = files
      .map((file) => ({
        ...file,
        filename: file.filename.trim() || "untitled.txt",
        content: file.content
      }))
      .filter((file) => file.content.trim() || file.filename.trim());

    if (cleanFiles.length === 0) {
      setError("Add at least one file first.");
      return;
    }

    setSaving(true);
    try {
      const { data: gist, error: gistError } = await supabase
        .from("gists")
        .insert({
          author_id: session.user.id,
          title: cleanFiles[0]?.filename || "untitled",
          description: description.trim() || null,
          is_public: visibility === "public"
        })
        .select()
        .single();
      if (gistError) throw gistError;

      const { error: filesError } = await supabase
        .from("gist_files")
        .insert(cleanFiles.map((file, index) => ({
          gist_id: gist.id,
          filename: file.filename,
          language: detectGistLanguage(file.filename),
          content: file.content,
          sort_order: index
        })));
      if (filesError) throw filesError;

      navigate(`/gists/${gist.id}`);
    } catch (saveError) {
      setError(saveError.message || "Could not create this gist.");
    } finally {
      setSaving(false);
    }
  }

  if (checked && !loggedIn) return <Navigate to="/login" replace />;

  return (
    <main className="gist-new-page">
      <header className="gists-header">
        <div>
          <span className="eyebrow">New snippet</span>
          <h1>Create a gist</h1>
          <p>Save a small piece of code with one or more files.</p>
        </div>
      </header>

      <form className="gist-new-form" onSubmit={handleCreate}>
        <label>
          Gist description
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Gist description (optional)" />
        </label>

        {files.map((file, index) => (
          <section className="gist-file-editor" key={index}>
            <div className="gist-file-row">
              <label>
                Filename
                <input value={file.filename} onChange={(event) => updateFile(index, "filename", event.target.value)} placeholder="hello.js" />
              </label>
              <span>{file.language}</span>
              <button disabled={files.length === 1} onClick={() => removeFile(index)} type="button"><Trash2 size={16} />Remove</button>
            </div>
            <textarea value={file.content} onChange={(event) => updateFile(index, "content", event.target.value)} placeholder="// Paste or write code here" rows={10} />
          </section>
        ))}

        <button className="button soft gist-add-file" onClick={addFile} type="button"><Plus size={16} />Add file</button>

        <div className="gist-visibility-row">
          <button className={visibility === "public" ? "active" : ""} onClick={() => setVisibility("public")} type="button">
            Public <small>Anyone can see this gist.</small>
          </button>
          <button className={visibility === "secret" ? "active" : ""} onClick={() => setVisibility("secret")} type="button">
            Secret <small>Only people with the link can view it.</small>
          </button>
        </div>

        {error && <p className="repo-create-status">{error}</p>}
        <button className="repo-create-submit" disabled={saving} type="submit">{saving ? "Creating gist..." : "Create gist"}</button>
      </form>
    </main>
  );
}
