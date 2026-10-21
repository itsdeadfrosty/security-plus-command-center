import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "@/components/QuestionCard";
import { toggleSelection } from "@/lib/engine/scoring";
import { makeQuestion } from "./helpers";
import { order } from "@/content/secplus/questions/helpers";

const multi = makeQuestion("ui-m", ["xss"], {
  stem: "Which apply? (Select TWO)",
  options: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"],
  correct: ["a", "c"],
  why: { b: "x", d: "x", e: "x" },
});

function Harness() {
  const [sel, setSel] = useState<string[]>([]);
  return <QuestionCard question={multi} examVersion="SY0-701" number={1} total={1} optionOrder={["a", "b", "c", "d", "e"]} selected={sel} onToggle={(id) => setSel((s) => toggleSelection(multi, s, id))} />;
}

describe("QuestionCard", () => {
  it("lets the learner select answers by clicking and enforces the select count", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    expect(screen.getByText("Select 2")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Alpha/ }));
    await user.click(screen.getByRole("checkbox", { name: /Charlie/ }));
    await user.click(screen.getByRole("checkbox", { name: /Delta/ }));
    expect(screen.getByRole("checkbox", { name: /Alpha/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: /Charlie/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: /Delta/ })).toHaveAttribute("aria-checked", "false");
  });

  it("shows correct and incorrect choices after submission", () => {
    render(
      <QuestionCard
        question={multi}
        examVersion="SY0-701"
        number={1}
        total={1}
        optionOrder={["a", "b", "c", "d", "e"]}
        selected={[]}
        onToggle={() => {}}
        answer={{ selectedAnswerIds: ["a", "b"], isCorrect: false, attemptId: "x" }}
      />,
    );
    expect(screen.getAllByText("(correct answer)")).toHaveLength(2);
    expect(screen.getByText("(your incorrect choice)")).toBeInTheDocument();
  });
});

describe("QuestionCard PBQs", () => {
  const steps = order({
    id: "ui-order",
    conceptIds: ["incident-response-process"],
    difficulty: "exam",
    stem: "Order these.",
    steps: ["First step", "Second step", "Third step"],
    explanation: "x",
  });

  function OrderHarness() {
    const [sel, setSel] = useState<string[]>(["c", "a", "b"]);
    return (
      <QuestionCard question={steps} examVersion="SY0-701" number={1} total={1} optionOrder={["c", "a", "b"]} selected={sel} onToggle={() => {}} onSetSelection={setSel} />
    );
  }

  it("reorders steps with the move buttons", async () => {
    render(<OrderHarness />);
    const user = userEvent.setup();
    const items = () => screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items()[0]).toContain("Third step");
    await user.click(screen.getByRole("button", { name: 'Move "First step" up' }));
    expect(items()[0]).toContain("First step");
    expect(screen.getByRole("button", { name: 'Move "First step" up' })).toBeDisabled();
  });
});
