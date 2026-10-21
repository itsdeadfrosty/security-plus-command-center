import { PlannedFeature } from "@/components/PlannedFeature";

export default function ChallengesPage() {
  return (
    <PlannedFeature
      title="Challenges"
      phase="Phase 4"
      intro="Interactive, simulated security scenarios — not multiple choice."
      items={[
        "Network defense: place controls on a diagram (Internet, firewall, DMZ, web server, database, internal network)",
        "Log investigation: spot failed-login bursts and suspicious successful logins",
        "Phishing investigation: find indicators in a fictional email and its headers",
        "Firewall rules: choose which rule to change to meet a requirement",
        "Incident response and vulnerability remediation prioritization",
        "Scoring on correctness, completion and attempts — not speed",
      ]}
    />
  );
}
