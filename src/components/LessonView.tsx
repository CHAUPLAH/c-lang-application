import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  HelpCircle,
} from 'lucide-react';
import { ALL_LESSONS, Lesson, SYLLABUS_MODULES } from '../data/syllabus';
import { ProgressState } from '../hooks/useProgress';
import { CodeCompiler } from './CodeCompiler';
import {
  BitConverterLab,
  CompilationFlowVisualizer,
  MemoryLayoutVisualizer,
} from './InteractiveVisualizers';
import { LessonQuiz } from './LessonQuiz';

interface LessonViewProps {
  lesson: Lesson;
  progress: ProgressState;
  onSelectLesson: (lessonId: string) => void;
  onToggleComplete: (lessonId: string) => void;
  onSaveCode: (lessonId: string, code: string) => void;
  onMarkCodeRun: (lessonId: string) => void;
  onRecordQuiz: (lessonId: string, score: number, total: number) => void;
  initialSubTab?: 'learn' | 'lab' | 'quiz';
}

export function LessonView({
  lesson,
  progress,
  onSelectLesson,
  onToggleComplete,
  onSaveCode,
  onMarkCodeRun,
  onRecordQuiz,
  initialSubTab = 'learn',
}: LessonViewProps) {
  const [mobileTab, setMobileTab] = useState<'learn' | 'lab' | 'quiz'>(initialSubTab);
  const [desktopFocus, setDesktopFocus] = useState<'concepts' | 'quiz'>('concepts');

  const mod = SYLLABUS_MODULES.find((m) => m.id === lesson.moduleId);
  const currentIdx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? ALL_LESSONS[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx + 1 < ALL_LESSONS.length
      ? ALL_LESSONS[currentIdx + 1]
      : null;

  const isCompleted = Boolean(progress.completedLessons[lesson.id]);
  const codeRan = Boolean(progress.codeRunLessons[lesson.id]);
  const quizRecord = progress.quizScores[lesson.id];
  const currentCode = progress.savedCode[lesson.id] ?? lesson.starterCode;

  return (
    <div className="space-y-5">
      {/* Lesson Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-sky-700 dark:text-sky-400">
              Module {mod?.number}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Lesson {lesson.number}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{lesson.estimatedMinutes} min</span>
            {codeRan && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Lab verified
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleComplete(lesson.id)}
            className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>

        <h1 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance]">
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {lesson.subtitle}
        </p>

        {/* Mobile/Tablet Segmented Switcher (< xl) */}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 xl:hidden dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setMobileTab('learn')}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mobileTab === 'learn'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Concepts
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('lab')}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mobileTab === 'lab'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Compiler
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('quiz')}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mobileTab === 'quiz'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Quiz ({lesson.quiz.length})
          </button>
        </div>

        {/* Desktop Concepts / Quiz Switcher */}
        <div className="hidden xl:flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setDesktopFocus('concepts')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                desktopFocus === 'concepts'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Lesson Notes
            </button>
            <button
              type="button"
              onClick={() => setDesktopFocus('quiz')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                desktopFocus === 'quiz'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Lesson Quiz ({lesson.quiz.length})
            </button>
          </div>
          {quizRecord && (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Best Quiz Score: {quizRecord.bestScore}/{quizRecord.total}
            </span>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-start">
        {/* Left Pane: Concepts or Quiz */}
        <div
          className={`space-y-5 xl:col-span-6 ${
            mobileTab === 'lab' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* Concepts Content */}
          <div
            className={`space-y-4 ${
              mobileTab === 'quiz'
                ? 'hidden'
                : desktopFocus === 'quiz'
                ? 'xl:hidden'
                : 'block'
            }`}
          >
            {/* Syllabus Coverage */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Syllabus Objectives
              </h2>
              <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {lesson.syllabusTopics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-sky-600 dark:bg-sky-400 shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Visualizer (Module 1 Labs) */}
            {lesson.interactiveWidget === 'memory-layout' && (
              <MemoryLayoutVisualizer />
            )}
            {lesson.interactiveWidget === 'bit-converter' && (
              <BitConverterLab />
            )}
            {lesson.interactiveWidget === 'compilation-flow' && (
              <CompilationFlowVisualizer />
            )}

            {/* Concept Sections */}
            {lesson.sections.map((sec) => (
              <article
                key={sec.title}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {sec.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {sec.summary}
                </p>
                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {sec.keyPoints.map((kp) => (
                    <li
                      key={kp}
                      className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300"
                    >
                      <span className="mt-2 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
                {sec.codeSnippet && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100">
                    {sec.codeSnippet}
                  </pre>
                )}
              </article>
            ))}

            {/* Prompt to practice on mobile */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ready to test your understanding of Lesson {lesson.number}?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('lab')}
                  className="xl:hidden min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  Open Compiler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('quiz');
                    setDesktopFocus('quiz');
                  }}
                  className="min-h-[40px] rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Quiz Panel */}
          <div
            className={
              mobileTab === 'quiz' || desktopFocus === 'quiz'
                ? 'block'
                : 'hidden'
            }
          >
            <LessonQuiz
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              questions={lesson.quiz}
              previousRecord={quizRecord}
              onComplete={(score, total) => onRecordQuiz(lesson.id, score, total)}
              onNextLesson={
                nextLesson
                  ? () => {
                      onSelectLesson(nextLesson.id);
                      setMobileTab('learn');
                      setDesktopFocus('concepts');
                    }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Right Pane: Real-time C Compiler */}
        <div
          className={`xl:col-span-6 xl:sticky xl:top-20 ${
            mobileTab === 'lab' ? 'block' : 'hidden xl:block'
          }`}
        >
          <CodeCompiler
            code={currentCode}
            onChange={(next) => onSaveCode(lesson.id, next)}
            starterCode={lesson.starterCode}
            stdinValue={lesson.starterStdin}
            challengePrompt={lesson.challengePrompt}
            onRunSuccess={() => onMarkCodeRun(lesson.id)}
          />
        </div>
      </div>

      {/* Bottom Lesson Pagination */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        {prevLesson ? (
          <button
            type="button"
            onClick={() => {
              onSelectLesson(prevLesson.id);
              setMobileTab('learn');
              setDesktopFocus('concepts');
            }}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-xs">
              {prevLesson.number} {prevLesson.title}
            </span>
          </button>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <button
            type="button"
            onClick={() => {
              onSelectLesson(nextLesson.id);
              setMobileTab('learn');
              setDesktopFocus('concepts');
            }}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="truncate max-w-[140px] sm:max-w-xs">
              {nextLesson.number} {nextLesson.title}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
