import {ASK_ITEMS, CHECK_ITEMS} from './catalog';

type AnswerLike = {status?: unknown; memo?: unknown; actionChecks?: unknown};

export type CheckSummary = {
  checked: number;
  checkTotal: number;
  problems: number;
  asked: number;
  askTotal: number;
};

const CHECK_IDS = new Set(CHECK_ITEMS.map(item => item.id));
const ASK_IDS = new Set(ASK_ITEMS.map(item => item.id));

function hasAnswer(answer: AnswerLike): boolean {
  if (typeof answer.memo === 'string' && answer.memo.trim()) return true;
  const checks = answer.actionChecks;
  return Boolean(checks && typeof checks === 'object' && Object.values(checks as Record<string, unknown>).some(Boolean));
}

/** 집 체크(확인한 항목)·문제 있음·질문 답변 수. 로컬(객체)과 서버(배열) 답변을 모두 받는다. */
export function summarizeAnswers(answers: Record<string, AnswerLike | undefined> | Array<AnswerLike & {itemId?: unknown}>): CheckSummary {
  const entries: Array<[string, AnswerLike]> = Array.isArray(answers)
    ? answers.filter(a => typeof a.itemId === 'string').map(a => [a.itemId as string, a])
    : Object.entries(answers).filter((entry): entry is [string, AnswerLike] => Boolean(entry[1]));
  let checked = 0, problems = 0, asked = 0;
  for (const [id, answer] of entries) {
    if (CHECK_IDS.has(id)) {
      if (answer.status === 'confirmed' || answer.status === 'caution') checked += 1;
      if (answer.status === 'caution') problems += 1;
    } else if (ASK_IDS.has(id) && hasAnswer(answer)) {
      asked += 1;
    }
  }
  return {checked, checkTotal: CHECK_ITEMS.length, problems, asked, askTotal: ASK_ITEMS.length};
}
