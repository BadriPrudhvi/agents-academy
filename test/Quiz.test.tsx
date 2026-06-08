import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Quiz from "@/components/interactive/Quiz";

const props = {
  question: "What separates an agent from a chatbot?",
  options: ["Bigger model", "It can decide, use tools, and act toward a goal", "Only text", "No model"],
  answerIndex: 1,
  explanation: "Goal-directed action over time is the defining trait.",
};

describe("Quiz", () => {
  it("hides the explanation until an answer is chosen", () => {
    render(<Quiz {...props} />);
    expect(screen.queryByText(props.explanation)).not.toBeInTheDocument();
  });

  it("shows a correct verdict + explanation when the right option is picked", () => {
    render(<Quiz {...props} />);
    fireEvent.click(screen.getByText(props.options[1]));
    expect(screen.getByText(/Correct\./)).toBeInTheDocument();
    expect(screen.getByText(props.explanation)).toBeInTheDocument();
  });

  it("shows a wrong verdict (with explanation) when an incorrect option is picked", () => {
    render(<Quiz {...props} />);
    fireEvent.click(screen.getByText(props.options[0]));
    expect(screen.getByText(/Not quite\./)).toBeInTheDocument();
    expect(screen.getByText(props.explanation)).toBeInTheDocument();
  });
});
