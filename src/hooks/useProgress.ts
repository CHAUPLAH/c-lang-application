import { useCallback, useEffect, useState } from 'react';
import { ALL_LESSONS } from '../data/syllabus';

export interface QuizRecord {
  bestScore: number;
  total: number;
  attempts: number;
  lastAttemptAt: string;
}

export interface ProgressState {
  completedLessons: Record<string, boolean>;
  codeRunLessons: Record<string, boolean>;
  quizScores: Record<string, QuizRecord>;
  savedCode: Record<string, string>;
  activeLessonId: string;
}

const STORAGE_KEY = 'structc_progress_v1';

const DEFAULT_PROGRESS: ProgressState = {
  completedLessons: {},
  codeRunLessons: {},
  quizScores: {},
  savedCode: {},
  activeLessonId: ALL_LESSONS[0].id,
};

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completedLessons: parsed.completedLessons ?? {},
      codeRunLessons: parsed.codeRunLessons ?? {},
      quizScores: parsed.quizScores ?? {},
      savedCode: parsed.savedCode ?? {},
      activeLessonId: parsed.activeLessonId ?? ALL_LESSONS[0].id,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }, [progress]);

  const setActiveLesson = useCallback((lessonId: string) => {
    setProgress((prev) => ({ ...prev, activeLessonId: lessonId }));
  }, []);

  const toggleLessonComplete = useCallback((lessonId: string, forceValue?: boolean) => {
    setProgress((prev) => {
      const next = forceValue !== undefined ? forceValue : !prev.completedLessons[lessonId];
      return {
        ...prev,
        completedLessons: { ...prev.completedLessons, [lessonId]: next },
      };
    });
  }, []);

  const markCodeRun = useCallback((lessonId: string) => {
    setProgress((prev) => ({
      ...prev,
      codeRunLessons: { ...prev.codeRunLessons, [lessonId]: true },
    }));
  }, []);

  const recordQuizAttempt = useCallback((lessonId: string, score: number, total: number) => {
    setProgress((prev) => {
      const existing = prev.quizScores[lessonId];
      const bestScore = existing ? Math.max(existing.bestScore, score) : score;
      const passed = score / total >= 0.6;
      return {
        ...prev,
        completedLessons: passed
          ? { ...prev.completedLessons, [lessonId]: true }
          : prev.completedLessons,
        quizScores: {
          ...prev.quizScores,
          [lessonId]: {
            bestScore,
            total,
            attempts: (existing?.attempts ?? 0) + 1,
            lastAttemptAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const saveLessonCode = useCallback((lessonId: string, code: string) => {
    setProgress((prev) => ({
      ...prev,
      savedCode: { ...prev.savedCode, [lessonId]: code },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Computed metrics
  const totalLessons = ALL_LESSONS.length;
  const completedCount = ALL_LESSONS.filter((l) => progress.completedLessons[l.id]).length;
  const codeRunCount = ALL_LESSONS.filter((l) => progress.codeRunLessons[l.id]).length;
  const quizzesTakenCount = ALL_LESSONS.filter((l) => progress.quizScores[l.id]).length;

  const totalQuizPoints = Object.values(progress.quizScores).reduce((acc, q) => acc + q.bestScore, 0);
  const totalQuizMax = Object.values(progress.quizScores).reduce((acc, q) => acc + q.total, 0);
  const overallPercent = Math.round((completedCount / totalLessons) * 100);

  return {
    progress,
    setActiveLesson,
    toggleLessonComplete,
    markCodeRun,
    recordQuizAttempt,
    saveLessonCode,
    resetProgress,
    stats: {
      totalLessons,
      completedCount,
      codeRunCount,
      quizzesTakenCount,
      totalQuizPoints,
      totalQuizMax,
      overallPercent,
    },
  };
}
