import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import AddCardModal from "../components/board/AddCardModal";
import AddColumnModal from "../components/board/AddColumnModal";
import BoardColumn from "../components/board/BoardColumn";
import Skeleton from "../components/ui/Skeleton";
import { useDocumentTitle } from "../lib/hooks";
import { supabase } from "../lib/supabase";
import { useRepoAccess } from "../lib/useRepoAccess";

const DEFAULT_COLUMNS = [
  { name: "To do", colour: "#f4efe6" },
  { name: "In progress", colour: "#ddd5f0" },
  { name: "Done", colour: "#c8d8c4" }
];

function ProjectRepoHeader({ repo, repoName, showInsights, username }) {
  return (
    <>
      <section className="issue-repo-header">
        <div className="repo-breadcrumb">
          <Link to="/repos">{username}</Link>
          <b>/</b>
          <Link to={`/${username}/${repoName}`}>{repoName}</Link>
        </div>
        <h1>{repo?.hero_title || repoName}</h1>
        <p>{repo?.description || "GitHub repository"}</p>
      </section>
      <nav className="repo-tab-bar issue-page-tabs" aria-label="Repository navigation">
        <Link to={`/${username}/${repoName}`}>Code</Link>
        <Link to={`/${username}/${repoName}/issues`}>Issues</Link>
        <Link to={`/${username}/${repoName}/pulls`}>Pull requests</Link>
        <Link className="active" to={`/${username}/${repoName}/projects`}>Projects</Link>
        {showInsights && <Link to={`/${username}/${repoName}/insights`}>Insights</Link>}
        <Link to={`/${username}/${repoName}`}>Commits</Link>
        <Link to={`/${username}/${repoName}`}>Branches</Link>
        <Link to={`/${username}/${repoName}`}>Settings</Link>
      </nav>
    </>
  );
}

export default function ProjectBoard() {
  const { username, repo: repoName } = useParams();
  useDocumentTitle(`Projects · ${repoName} · ${username}`);
  const [repo, setRepo] = useState(null);
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { canMerge, isContributor, loading: accessLoading } = useRepoAccess(repo?.id, repo?.owner_id);
  const canEdit = isContributor;

  const cardsByColumn = useMemo(() => {
    return cards.reduce((groups, card) => {
      const columnCards = groups[card.column_id] || [];
      groups[card.column_id] = [...columnCards, card];
      return groups;
    }, {});
  }, [cards]);

  const fetchBoard = useCallback(async (repository = repo, options = {}) => {
    if (!supabase || !repository?.id) return;
    const allowCreate = options.allowCreate ?? canEdit;

    const { data: existingBoard, error: boardError } = await supabase
      .from("project_boards")
      .select("*")
      .eq("repo_id", repository.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (boardError) throw boardError;

    let activeBoard = existingBoard;
    if (!activeBoard && allowCreate) {
      const { data: createdBoard, error: createBoardError } = await supabase
        .from("project_boards")
        .insert({ repo_id: repository.id, name: "Project board" })
        .select()
        .single();
      if (createBoardError) throw createBoardError;

      const { error: columnsError } = await supabase
        .from("board_columns")
        .insert(DEFAULT_COLUMNS.map((column, index) => ({
          board_id: createdBoard.id,
          name: column.name,
          colour: column.colour,
          sort_order: index
        })));
      if (columnsError) throw columnsError;
      activeBoard = createdBoard;
    }

    setBoard(activeBoard || null);
    if (!activeBoard) {
      setColumns([]);
      setCards([]);
      return;
    }

    const { data: columnRows, error: columnError } = await supabase
      .from("board_columns")
      .select("*")
      .eq("board_id", activeBoard.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (columnError) throw columnError;

    setColumns(columnRows || []);

    if (!columnRows?.length) {
      setCards([]);
      return;
    }

    const { data: cardRows, error: cardError } = await supabase
      .from("board_cards")
      .select("*, issue:issues(id, number, title, status)")
      .in("column_id", columnRows.map((column) => column.id))
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (cardError) throw cardError;

    setCards(cardRows || []);
  }, [canEdit, repo]);

  useEffect(() => {
    let alive = true;

    async function loadRepo() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: repository, error: repoError } = await supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey!inner(id, username, display_name, avatar_style)")
        .eq("name", repoName)
        .eq("profiles.username", username)
        .maybeSingle();

      if (!alive) return;
      if (repoError || !repository) {
        setRepo(null);
        setError(repoError?.message || "Repository not found.");
        setLoading(false);
        return;
      }

      setRepo(repository);

      const { data: issueRows } = await supabase
        .from("issues")
        .select("id, number, title, status")
        .eq("repo_id", repository.id)
        .eq("status", "open")
        .order("number", { ascending: false });

      if (!alive) return;
      setIssues(issueRows || []);
      setLoading(false);
    }

    loadRepo();
    return () => {
      alive = false;
    };
  }, [repoName, username]);

  useEffect(() => {
    if (!repo || accessLoading) return;
    let alive = true;

    async function loadBoard() {
      try {
        setError("");
        await fetchBoard(repo, { allowCreate: canEdit });
      } catch (loadError) {
        if (alive) setError(loadError.message || "Could not load this project board.");
      }
    }

    loadBoard();
    return () => {
      alive = false;
    };
  }, [accessLoading, canEdit, fetchBoard, repo]);

  function handleDragStart(event, card) {
    event.dataTransfer.setData("cardId", card.id);
    event.dataTransfer.setData("columnId", card.column_id);
  }

  async function handleDrop(event, targetColumn) {
    event.preventDefault();
    if (!canEdit) return;

    const cardId = event.dataTransfer.getData("cardId");
    const fromColumnId = event.dataTransfer.getData("columnId");
    if (!cardId || fromColumnId === targetColumn.id) return;

    setSaving(true);
    try {
      const targetCards = cardsByColumn[targetColumn.id] || [];
      const { error: updateError } = await supabase
        .from("board_cards")
        .update({ column_id: targetColumn.id, sort_order: targetCards.length })
        .eq("id", cardId);
      if (updateError) throw updateError;
      await fetchBoard();
    } catch (dropError) {
      setError(dropError.message || "Could not move that card.");
    } finally {
      setSaving(false);
    }
  }

  async function addCard(card) {
    if (!selectedColumn) return;
    setSaving(true);
    try {
      const existingCards = cardsByColumn[selectedColumn.id] || [];
      const { error: insertError } = await supabase.from("board_cards").insert({
        column_id: selectedColumn.id,
        issue_id: card.issue?.id || null,
        title: card.issue?.title || card.title,
        body: card.body || null,
        sort_order: existingCards.length
      });
      if (insertError) throw insertError;
      setSelectedColumn(null);
      await fetchBoard();
    } catch (insertError) {
      setError(insertError.message || "Could not add this card.");
    } finally {
      setSaving(false);
    }
  }

  async function addColumn(column) {
    if (!board) return;
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from("board_columns").insert({
        board_id: board.id,
        name: column.name.trim(),
        colour: column.colour,
        sort_order: columns.length
      });
      if (insertError) throw insertError;
      setAddColumnOpen(false);
      await fetchBoard();
    } catch (insertError) {
      setError(insertError.message || "Could not create this column.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="project-board-page">
      <ProjectRepoHeader repo={repo} repoName={repoName} showInsights={canMerge} username={username} />

      <section className="project-board-header">
        <div>
          <span className="eyebrow">Project board</span>
          <h2>{board?.name || "Project board"}</h2>
          {!canEdit && <p>Read-only view. Contributors can add columns, add cards, and move work between columns.</p>}
        </div>
        {canEdit && (
          <button className="new-issue-button" disabled={saving || !board} onClick={() => setAddColumnOpen(true)} type="button">
            <Plus size={16} />Add column
          </button>
        )}
      </section>

      {loading || accessLoading ? (
        <div className="project-board-loading">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton className="board-column-skeleton" key={index} />)}
        </div>
      ) : error ? (
        <p className="auth-error">{error}</p>
      ) : !board ? (
        <div className="issue-empty-state">
          <h2>No project board yet</h2>
          <p>A contributor can open this page to create the first board for this repository.</p>
        </div>
      ) : (
        <div className="project-board-scroll" aria-busy={saving}>
          {columns.map((column) => (
            <BoardColumn
              canEdit={canEdit}
              cards={cardsByColumn[column.id] || []}
              column={column}
              key={column.id}
              onAddCard={setSelectedColumn}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {selectedColumn && (
        <AddCardModal
          issues={issues}
          onClose={() => setSelectedColumn(null)}
          onSubmit={addCard}
          selectedColumn={selectedColumn}
        />
      )}
      {addColumnOpen && <AddColumnModal onClose={() => setAddColumnOpen(false)} onSubmit={addColumn} />}
    </div>
  );
}
