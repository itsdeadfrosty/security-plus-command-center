import { PlannedFeature } from "@/components/PlannedFeature";

export default function ExamPage() {
  return (
    <PlannedFeature
      title="Exam Simulator"
      phase="Phase 5"
      intro="Timed, domain-balanced practice exams modeled on the public SY0-701 format (up to 90 questions, 90 minutes)."
      items={[
        "Configurable length with a full-length option",
        "No feedback or hints until you submit",
        "Flagging and free navigation between questions",
        "Results by domain and concept, with missed concepts sent to Review",
        "An estimated readiness indicator, clearly labeled as an estimate — not your official scaled score (passing is 750 on 100–900)",
      ]}
    >
      <p className="mb-4 text-sm text-muted">
        The question bank needs to grow well past 90 questions before a full-length exam is meaningful. Until then, Mixed Practice gives you
        domain-weighted questions.
      </p>
    </PlannedFeature>
  );
}
