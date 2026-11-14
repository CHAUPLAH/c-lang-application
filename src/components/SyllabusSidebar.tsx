import React from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { SYLLABUS_MODULES } from '../data/syllabus';
import { ProgressState } from '../hooks/useProgress';

interface SyllabusSidebarProps {
  activeLessonId: string;
  progress: ProgressState;
  onSelectLesson: (lessonId: string) => void;
}

export function SyllabusSidebar({
  activeLessonId,
  progress,
  onSelectLesson,
}: SyllabusSidebarProps) {
  return (
    <div className="space-y-5">
      {SYLLABUS_MODULES.map((mod) => {
        const completedInMod = mod.lessons.filter(
          (l) => progress.completedLessons[l.id]
        ).length;

        return (
          <div key={mod.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 px-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Module {mod.number}
              </h3>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {completedInMod}/{mod.lessons.length} · {mod.hours} hrs
              </span>
            </div>
            <p className="px-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {mod.title}
            </p>

            <ul className="mt-1 space-y-1">
              {mod.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const isDone = Boolean(progress.completedLessons[lesson.id]);
                const quizRec = progress.quizScores[lesson.id];

                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`min-h-[44px] w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100'
                          : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Circle
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? 'text-sky-600 dark:text-sky-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">
                            {lesson.number} {lesson.title}
                          </div>
                          {quizRec && (
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              Quiz {quizRec.bestScore}/{quizRec.total}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isActive
                            ? 'text-sky-600 dark:text-sky-400 translate-x-0.5'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
