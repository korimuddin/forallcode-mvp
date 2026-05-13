import CertificationResult from "./CertificationResult";

export default function GitTeamsResult() {
  return (
    <CertificationResult
      certType="git-for-teams"
      name="Git for Teams"
      passPercent={75}
      retryPath="/certification/git-for-teams"
    />
  );
}
