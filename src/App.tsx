import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun,
  Terminal,
  X,
} from 'lucide-react';
import { LessonView } from './components/LessonView';
import { PlaygroundView } from './components/PlaygroundView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { QuizzesHub } from './components/QuizzesHub';
import { SyllabusSidebar } from './components/SyllabusSidebar';
import { getLessonById } from './data/syllabus';
import { useProgress } from './hooks/useProgress';

type AppTab = 'syllabus' | 'compiler' | 'quizzes' | 'progress';

export default function App() {
  const {
    progress,
    setActiveLesson,
    toggleLessonComplete,
    markCodeRun,
    recordQuizAttempt,
    saveLessonCode,
    resetProgress,
    stats,
  } = useProgress();

  const [activeTab, setActiveTab] = useState<AppTab>('syllabus');
  const [lessonSubTab, setLessonSubTab] = useState<'learn' | 'lab' | 'quiz'>('learn');
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('structc_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('structc_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore
    }
  }, [darkMode]);

  const activeLesson = getLessonById(progress.activeLessonId);

  const handleSelectLesson = (lessonId: string, subTab: 'learn' | 'lab' | 'quiz' = 'learn') => {
    setActiveLesson(lessonId);
    setLessonSubTab(subTab);
    setActiveTab('syllabus');
    setMobileSyllabusOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'compiler', label: 'Compiler', icon: Terminal },
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar (3-zone contract: Wordmark — 4 Nav Links — 1 Primary Action) */}
      <header className="sticky top-0 z-30 h-[52px] sm:h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('syllabus')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 dark:text-slate-100 dark:hover:text-sky-400"
          >
            StructC
          </button>

          {/* Zone 2: 4 Single-line Nav Links (desktop/tablet) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-sky-600 text-slate-900 dark:border-sky-400 dark:text-slate-100'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Action (Light/Dark Theme Switch) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {darkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 md:pb-10">
        {activeTab === 'syllabus' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Mobile Compact Lesson Switcher Trigger (< lg) */}
            <div className="w-full lg:hidden">
              <button
                type="button"
                onClick={() => setMobileSyllabusOpen(true)}
                className="min-h-[44px] w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    Syllabus · {stats.completedCount}/{stats.totalLessons} completed ({stats.overallPercent}%)
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeLesson.number} {activeLesson.title}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400 whitespace-nowrap shrink-0">
                  Lessons
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* Desktop Left Syllabus Rail (lg+) */}
            <aside className="hidden lg:block w-72 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 px-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    C Syllabus
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {stats.completedCount}/{stats.totalLessons} ({stats.overallPercent}%)
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full bg-sky-600 transition-all duration-300 dark:bg-sky-400"
                    style={{ width: `${stats.overallPercent}%` }}
                  />
                </div>
              </div>

              <SyllabusSidebar
                activeLessonId={activeLesson.id}
                progress={progress}
                onSelectLesson={(id) => handleSelectLesson(id, 'learn')}
              />
            </aside>

            {/* Active Lesson Workspace */}
            <div className="flex-1 min-w-0 w-full">
              <LessonView
                key={`${activeLesson.id}-${lessonSubTab}`}
                lesson={activeLesson}
                progress={progress}
                initialSubTab={lessonSubTab}
                onSelectLesson={(id) => handleSelectLesson(id, 'learn')}
                onToggleComplete={(id) => toggleLessonComplete(id)}
                onSaveCode={saveLessonCode}
                onMarkCodeRun={markCodeRun}
                onRecordQuiz={recordQuizAttempt}
              />
            </div>
          </div>
        )}

        {activeTab === 'compiler' && (
          <div className="mx-auto max-w-5xl">
            <PlaygroundView />
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="mx-auto max-w-4xl">
            <QuizzesHub
              progress={progress}
              onStartQuiz={(lessonId) => handleSelectLesson(lessonId, 'quiz')}
            />
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="mx-auto max-w-4xl">
            <ProgressDashboard
              progress={progress}
              stats={stats}
              onOpenLesson={(lessonId) => handleSelectLesson(lessonId, 'learn')}
              onResetProgress={resetProgress}
            />
          </div>
        )}
      </main>

      {/* Mobile Syllabus Bottom Sheet Drawer */}
      {mobileSyllabusOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Course Syllabus"
        >
          <div
            className="flex-1"
            onClick={() => setMobileSyllabusOpen(false)}
          />
          <div className="max-h-[82vh] flex flex-col rounded-t-2xl border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  C Programming Syllabus
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {stats.completedCount} of {stats.totalLessons} lessons completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSyllabusOpen(false)}
                aria-label="Close syllabus drawer"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 pb-8">
              <SyllabusSidebar
                activeLessonId={activeLesson.id}
                progress={progress}
                onSelectLesson={(id) => handleSelectLesson(id, 'learn')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (< md) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 pb-safe border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      >
        <div className="grid grid-cols-4 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium tracking-tight leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
