import { useDocumentTitle } from "../lib/hooks";
import { PageFrame, Workspace } from "./PageShared";

function WorkspacePage() {
  useDocumentTitle("Workspace");
  return (
    <PageFrame title="My Workspace" eyebrow="Private desk">
      <Workspace interactive />
    </PageFrame>
  );
}

export { WorkspacePage };
