import { Link } from "react-router-dom";

export default function AssessmentDisclosure() {
  return (
    <p className="journey-disclosure">This optional paid assessment is issued by ForAllCode. It tests conceptual knowledge, not independently observed project work, and does not guarantee employer recognition. <Link to="/learn/pull-request-best-practices#project-practice">Try the free project practice task</Link> alongside your lessons.</p>
  );
}
