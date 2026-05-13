import CertificationResult from "./CertificationResult";

export default function OpenSourceResult() {
  return (
    <CertificationResult
      certType="open-source-contributor"
      name="Open Source Contributor"
      passPercent={70}
      retryPath="/certification/open-source-contributor"
    />
  );
}
