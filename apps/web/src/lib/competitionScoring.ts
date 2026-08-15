export function competitionAnswersMatch(selected: string[], correct: string[]): boolean {
  if (selected.length !== correct.length) return false;
  const a = [...selected].sort();
  const b = [...correct].sort();
  return a.every((id, i) => id === b[i]);
}

export function scoreCompetitionAnswers(
  answers: { selectedOptionIds: string[]; correctOptionIds: string[] }[]
): { score: number; maxScore: number } {
  return {
    score: answers.filter((row) => competitionAnswersMatch(row.selectedOptionIds, row.correctOptionIds)).length,
    maxScore: answers.length,
  };
}
