"use client";

import { useState } from "react";
import { Send, RotateCcw } from "lucide-react";

import { createQuizAttempt } from "@/lib/api";
import type { QuizRow } from "@/lib/api-student";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// UI quiz dùng chung: quiz theo bài học VÀ quiz chặng (khối bài tập gọi lại).
// Trượt cho làm lại ngay, mọi lượt đều lưu quiz_attempts.

export interface QuizSectionProps {
  quiz: QuizRow;
  userId: string;
  heading?: string;
  onPassed?: () => void;
}

export function QuizSection({ quiz, userId, heading, onPassed }: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getScore = () => {
    if (quiz.questions.length === 0) return 0;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const score = getScore();
    const passed = score >= quiz.pass_score;
    try {
      await createQuizAttempt({
        quiz_id: quiz.id,
        user_id: userId,
        answers: quiz.questions.map((_, i) => answers[i] ?? -1),
        score,
        passed,
      });
      setSubmitted(true);
      if (passed) onPassed?.();
    } catch (err) {
      console.error("Không lưu được lượt làm quiz:", err);
    }
    setSubmitting(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const score = getScore();
  const passed = score >= quiz.pass_score;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground">{heading || quiz.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Đạt {quiz.pass_score}% để vượt qua · Trượt được làm lại ngay
        </p>
      </div>

      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {qIndex + 1}. {q.question}
          </p>
          <div className="space-y-1.5 pl-4">
            {q.options.map((opt, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              let optClass = "border-gold-shadow/30";
              if (submitted) {
                // Chỉ chấm ô đã chọn. Tô cả đáp án đúng sẽ làm lượt "Làm lại" mất giá trị.
                if (isSelected)
                  optClass =
                    q.correct === oIndex
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10";
              } else if (isSelected) {
                optClass = "border-gold bg-gold/10";
              }

              return (
                <label
                  key={oIndex}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors",
                    optClass,
                    submitted && "cursor-default"
                  )}
                >
                  <input
                    type="radio"
                    name={`quiz-${quiz.id}-q-${qIndex}`}
                    checked={isSelected}
                    disabled={submitted}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))
                    }
                    className="accent-gold"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length < quiz.questions.length}
          className="bg-gold text-black hover:bg-gold/90"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "rounded-lg p-4 text-sm font-medium",
              passed
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}
          >
            Kết quả: {score}% —{" "}
            {passed ? "Bạn đã vượt qua!" : "Chưa đạt. Hãy xem lại bài học và thử lại."}
          </div>
          {!passed && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm lại
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
