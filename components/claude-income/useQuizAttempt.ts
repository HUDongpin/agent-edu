"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { CLAUDE_INCOME_QUIZ_ATTEMPT_CONFIG } from "./quiz-attempt-config";
import {
  clearClaudeIncomeQuizAttempt,
  isClaudeIncomeQuizAttemptPersistenceAvailable,
  parseClaudeIncomeQuizAttempt,
  readClaudeIncomeQuizAttemptSnapshot,
  subscribeToClaudeIncomeQuizAttempt,
} from "./quiz-attempt-store";

export function useClaudeIncomeQuizAttempt() {
  const raw = useSyncExternalStore(
    subscribeToClaudeIncomeQuizAttempt,
    readClaudeIncomeQuizAttemptSnapshot,
    () => null,
  );
  const persistenceAvailable = useSyncExternalStore(
    subscribeToClaudeIncomeQuizAttempt,
    isClaudeIncomeQuizAttemptPersistenceAvailable,
    () => true,
  );
  const draft = useMemo(
    () => raw ? parseClaudeIncomeQuizAttempt(raw, CLAUDE_INCOME_QUIZ_ATTEMPT_CONFIG) : null,
    [raw],
  );

  useEffect(() => {
    if (raw && !draft) clearClaudeIncomeQuizAttempt();
  }, [draft, raw]);

  return { draft, persistenceAvailable, raw } as const;
}
