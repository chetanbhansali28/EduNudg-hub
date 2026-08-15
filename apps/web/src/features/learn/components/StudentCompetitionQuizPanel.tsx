import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, MutationError } from "@edunudg/ui";
import {
  fetchStudentCompetitionQuiz,
  startCompetitionAttempt,
  submitCompetitionAttempt,
} from "@/lib/competitionQuizApi";

type Props = { competitionId: string; onClose: () => void };

export function StudentCompetitionQuizPanel({ competitionId, onClose }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const quiz = useQuery({
    queryKey: ["student-competition-quiz", competitionId],
    queryFn: () => fetchStudentCompetitionQuiz(competitionId),
  });

  const start = useMutation({
    mutationFn: () => startCompetitionAttempt(competitionId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["student-competition-quiz", competitionId] }),
  });

  const submit = useMutation({
    mutationFn: () =>
      submitCompetitionAttempt(
        competitionId,
        (quiz.data?.questions ?? []).map((q) => ({
          competition_question_id: q.id,
          selected_option_ids: selected[q.id] ?? [],
        }))
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-competition-quiz", competitionId] });
      void qc.invalidateQueries({ queryKey: ["student-competitions"] });
    },
  });

  const data = quiz.data;
  const submitted = data?.attempt_status === "submitted";
  const reviewByQuestion = new Map((data?.review ?? []).map((r) => [r.competition_question_id, r]));

  const toggleOption = (questionId: string, optionId: string, multi: boolean) => {
    setSelected((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        return {
          ...prev,
          [questionId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  return (
    <section className="ed-sp-quiz">
      <header className="ed-sp-quiz__head">
        <h2 className="ed-sp-competition__title">{data?.name ?? "Quiz"}</h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </header>
      {quiz.isLoading ? <p className="ed-muted">Loading quiz…</p> : null}
      <MutationError
        message={
          start.error instanceof Error
            ? start.error.message
            : submit.error instanceof Error
              ? submit.error.message
              : quiz.error instanceof Error
                ? quiz.error.message
                : null
        }
      />

      {submitted && data?.score != null ? (
        <p className="ed-sp-quiz__score">
          Score: {data.score} / {data.max_score}
        </p>
      ) : null}

      {(data?.questions ?? []).map((q, i) => {
        const review = reviewByQuestion.get(q.id);
        const multi = submitted
          ? (review?.correct_option_ids.length ?? 1) > 1
          : true;
        const chosen = submitted ? (review?.selected_option_ids ?? []) : (selected[q.id] ?? []);
        return (
          <article key={q.id} className="ed-sp-quiz__q">
            <h3>
              {i + 1}. {q.prompt}
            </h3>
            <ul>
              {q.options.map((opt) => {
                const checked = chosen.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <label>
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={q.id}
                        checked={checked}
                        disabled={submitted}
                        onChange={() => toggleOption(q.id, opt.id, multi)}
                      />{" "}
                      {opt.text}
                    </label>
                  </li>
                );
              })}
            </ul>
            {submitted && review ? (
              <p className="ed-text-sm ed-muted">
                {review.is_correct ? "Correct" : "Incorrect"}
                {review.explanation ? ` — ${review.explanation}` : ""}
              </p>
            ) : null}
          </article>
        );
      })}

      {!submitted && data ? (
        <div className="ed-sp-actions">
          {data.attempt_status === "none" ? (
            <Button onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending ? "Starting…" : "Start quiz"}
            </Button>
          ) : (
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit answers"}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
