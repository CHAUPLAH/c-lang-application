import React from 'react';
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { SYLLABUS_MODULES } from '../data/syllabus';
import { ProgressState } from '../hooks/useProgress';

interface QuizzesHubProps {
  progress: ProgressState;
  onStartQuiz: (lessonId: string) => void;
}

export function QuizzesHub({ progress, onStartQuiz }: QuizzesHubProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Module Quizzes
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Test your mastery across all 11 syllabus lessons. Score 60% or higher to mark a lesson complete automatically.
        </p>
      </div>

      <div className="space-y-6">
        {SYLLABUS_MODULES.map((mod) => (
          <section
            key={mod.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Module {mod.number}: {mod.title}
              </h2>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {mod.hours} Hours · {mod.lessons.length} Quizzes
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {mod.lessons.map((lesson) => {
                const record = progress.quizScores[lesson.id];
                const passed =
                  record !== undefined && record.bestScore / record.total >= 0.6;

                return (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">Lesson {lesson.number}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {lesson.quiz.length} questions
                        </span>
                        {record && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                                passed
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {passed && <CheckCircle2 className="h-3.5 w-3.5" />}
                              Best {record.bestScore}/{record.total}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {lesson.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartQuiz(lesson.id)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-900 transition-colors whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-sky-950/50"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {record ? 'Retake Quiz' : 'Start Quiz'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
