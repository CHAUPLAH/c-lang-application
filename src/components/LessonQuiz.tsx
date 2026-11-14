import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { QuizQuestion } from '../data/syllabus';
import { QuizRecord } from '../hooks/useProgress';

interface LessonQuizProps {
  lessonId: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  previousRecord?: QuizRecord;
  onComplete: (score: number, total: number) => void;
  onNextLesson?: () => void;
}

export function LessonQuiz({
  lessonId,
  lessonTitle,
  questions,
  previousRecord,
  onComplete,
  onNextLesson,
}: LessonQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  // Reset quiz state when switching lessons
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setRevealed(false);
    setAnswers({});
    setFinished(false);
  }, [lessonId]);

  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelectedIdx(idx);
  };

  const handleCheck = () => {
    if (selectedIdx === null) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: selectedIdx }));
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
      setRevealed(false);
    } else {
      // Compute final score
      let correctCount = 0;
      for (const q of questions) {
        const chosen = q.id === currentQ.id ? selectedIdx : answers[q.id];
        if (chosen === q.correctIndex) correctCount++;
      }
      setFinished(true);
      onComplete(correctCount, questions.length);
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setRevealed(false);
    setAnswers({});
    setFinished(false);
  };

  if (finished) {
    const finalScore = questions.reduce(
      (sum, q) => sum + (answers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
    const pct = Math.round((finalScore / questions.length) * 100);
    const passed = pct >= 60;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quiz Complete · {lessonTitle}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {finalScore} of {questions.length} Correct ({pct}%)
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              passed
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {passed ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Passed · Lesson Completed
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" /> Review &amp; Retry (60% to pass)
              </>
            )}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {questions.map((q, idx) => {
            const chosen = answers[q.id];
            const isRight = chosen === q.correctIndex;
            return (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    {idx + 1}. {q.question}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${
                      isRight
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {isRight ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                </div>
                {!isRight && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    Answer: <span className="font-semibold text-slate-800 dark:text-slate-200">{q.options[q.correctIndex]}</span> — {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
          {onNextLesson && (
            <button
              type="button"
              onClick={onNextLesson}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              Next Lesson
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <span>
            Question {currentIdx + 1} of {questions.length}
          </span>
          {previousRecord && (
            <>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <span>
                Best: {previousRecord.bestScore}/{previousRecord.total}
              </span>
            </>
          )}
        </div>
        {/* Subtle progress bar */}
        <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
          <div
            className="h-full bg-sky-600 transition-all duration-200 dark:bg-sky-400"
            style={{ width: `${((currentIdx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="mt-4 text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {currentQ.question}
      </h3>

      {currentQ.codeContext && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100">
          {currentQ.codeContext}
        </pre>
      )}

      <div className="mt-4 space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === currentQ.correctIndex;

          let styleClass =
            'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-800/60';
          if (revealed) {
            if (isCorrect) {
              styleClass =
                'border-emerald-500 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100';
            } else if (isSelected && !isCorrect) {
              styleClass =
                'border-red-500 bg-red-50/70 text-red-950 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100';
            } else {
              styleClass =
                'border-slate-200 bg-slate-50/40 text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-500';
            }
          } else if (isSelected) {
            styleClass =
              'border-sky-600 bg-sky-50/80 text-sky-950 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={`min-h-[48px] w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${styleClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </div>
              {revealed && isCorrect && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" /> Correct
                </span>
              )}
              {revealed && isSelected && !isCorrect && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">
                  <XCircle className="h-4 w-4" /> Incorrect
                </span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Explanation: </span>
          {currentQ.explanation}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        {!revealed ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedIdx === null}
            className="min-h-[44px] rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            Check Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {currentIdx + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
