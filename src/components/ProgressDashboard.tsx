import React, { useState } from 'react';
import { CheckCircle2, Code2, RotateCcw } from 'lucide-react';
import { SYLLABUS_MODULES } from '../data/syllabus';
import { ProgressState } from '../hooks/useProgress';

interface ProgressDashboardProps {
  progress: ProgressState;
  stats: {
    totalLessons: number;
    completedCount: number;
    codeRunCount: number;
    quizzesTakenCount: number;
    totalQuizPoints: number;
    totalQuizMax: number;
    overallPercent: number;
  };
  onOpenLesson: (lessonId: string) => void;
  onResetProgress: () => void;
}

export function ProgressDashboard({
  progress,
  stats,
  onOpenLesson,
  onResetProgress,
}: ProgressDashboardProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const quizAccuracy =
    stats.totalQuizMax > 0
      ? Math.round((stats.totalQuizPoints / stats.totalQuizMax) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Learning Progress
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your progress is saved locally on this device so you can study offline or on the go.
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:border-red-200 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-red-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Progress
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Clear all saved progress?
            </span>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="min-h-[40px] rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Syllabus Mastery
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.overallPercent}%
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-sky-600 dark:bg-sky-400"
              style={{ width: `${stats.overallPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Lessons Completed
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.completedCount} / {stats.totalLessons}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across 4 modules (42 hrs)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Code Labs Run
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.codeRunCount} / {stats.totalLessons}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Compiled in browser
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Quiz Accuracy
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalQuizMax > 0 ? `${quizAccuracy}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.quizzesTakenCount} of {stats.totalLessons} quizzes taken
          </div>
        </div>
      </div>

      {/* Per-Module Breakdown */}
      <div className="space-y-4">
        {SYLLABUS_MODULES.map((mod) => {
          const doneInMod = mod.lessons.filter(
            (l) => progress.completedLessons[l.id]
          ).length;
          const modPct = Math.round((doneInMod / mod.lessons.length) * 100);

          return (
            <div
              key={mod.id}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Module {mod.number}: {mod.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {doneInMod} of {mod.lessons.length} lessons completed · {mod.hours} syllabus hours
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                  {modPct}%
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {mod.lessons.map((lesson) => {
                  const completed = Boolean(progress.completedLessons[lesson.id]);
                  const ran = Boolean(progress.codeRunLessons[lesson.id]);
                  const q = progress.quizScores[lesson.id];

                  return (
                    <div
                      key={lesson.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenLesson(lesson.id)}
                        className="min-h-[40px] flex items-center gap-2.5 text-left hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            completed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {lesson.number} {lesson.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-3 pl-6 sm:pl-0 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Code2 className="h-3.5 w-3.5" />
                          {ran ? 'Lab run' : 'Not run'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {q ? `Quiz ${q.bestScore}/${q.total}` : 'Quiz pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
