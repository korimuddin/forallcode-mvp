import CertificationResult from "./CertificationResult";

export default function CLIResult() {
  return (
    <CertificationResult
      certType="command-line-essentials"
      name="Command Line Essentials"
      passPercent={70}
      retryPath="/certification/command-line-essentials"
    />
  );
}
