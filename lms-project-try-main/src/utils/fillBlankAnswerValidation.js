export function normalizeFillBlankAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** Exact match on normalized strings (spacing, case, punctuation stripped). */
export function matchFillBlankAnswer(studentAnswer, correctAnswer) {
  const normalizedStudent = normalizeFillBlankAnswer(studentAnswer);
  const normalizedCorrect = normalizeFillBlankAnswer(correctAnswer);
  if (!normalizedCorrect || !normalizedStudent) return false;
  return normalizedStudent === normalizedCorrect;
}

export function getFillBlankCorrectAnswer(question) {
  const raw = question?.acceptedAnswers ?? question?.accepted_answers;
  if (Array.isArray(raw)) {
    const first = raw.map((a) => String(a || '').trim()).find(Boolean);
    if (first) return first;
  } else if (raw) {
    const single = String(raw).trim();
    if (single) return single;
  }
  return '';
}

export function gradeFillBlankAnswer(question, studentAnswer) {
  const correct = getFillBlankCorrectAnswer(question);
  if (!correct) return false;
  return matchFillBlankAnswer(studentAnswer, correct);
}
