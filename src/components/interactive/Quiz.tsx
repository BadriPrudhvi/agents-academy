import { useState } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

interface Props {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export default function Quiz({ question, options, answerIndex, explanation }: Props) {
  const [choice, setChoice] = useState<number | null>(null);
  const answered = choice !== null;
  const correct = choice === answerIndex;

  return (
    <div className="my-6">
      <p className="mb-3 font-medium text-foreground-100">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const state = !answered
            ? "idle"
            : i === answerIndex
              ? "correct"
              : i === choice
                ? "wrong"
                : "idle";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setChoice(i)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                state === "correct"
                  ? "border-ai-100 bg-ai-200"
                  : state === "wrong"
                    ? "border-accent-muted bg-accent-100/10"
                    : "border-border-100 hover:border-foreground-300"
              }`}
            >
              {answered && i === answerIndex && <CheckCircle size={16} weight="fill" className="text-ai-100" />}
              {answered && i === choice && i !== answerIndex && (
                <XCircle size={16} weight="fill" className="text-accent-muted" />
              )}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-3 text-sm text-foreground-200">
          <span className={`font-medium ${correct ? "text-ai-100" : "text-accent-muted"}`}>
            {correct ? "Correct. " : "Not quite. "}
          </span>
          {explanation}
        </p>
      )}
    </div>
  );
}
