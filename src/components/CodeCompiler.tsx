import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  HardDrive,
  Play,
  RotateCcw,
  Terminal,
  Trash2,
} from 'lucide-react';
import {
  checkCSyntax,
  ExecutionResult,
  runCProgram,
  SyntaxCheckResult,
} from '../engine/cInterpreter';

interface CodeCompilerProps {
  code: string;
  onChange: (nextCode: string) => void;
  starterCode?: string;
  stdinValue?: string;
  onRunSuccess?: () => void;
  challengePrompt?: string;
  compactHeader?: boolean;
  presets?: { label: string; code: string; stdin?: string }[];
}

const MOBILE_SYMBOLS = [
  { label: ';', insert: ';' },
  { label: '{ }', insert: '{\n    \n}', cursorOffset: -2 },
  { label: '( )', insert: '()', cursorOffset: -1 },
  { label: '*', insert: '*' },
  { label: '&', insert: '&' },
  { label: '" "', insert: '""', cursorOffset: -1 },
  { label: '\\n', insert: '\\n' },
  { label: '%d', insert: '%d' },
  { label: '->', insert: '->' },
  { label: '#include', insert: '#include <stdio.h>\n' },
];

export function CodeCompiler({
  code,
  onChange,
  starterCode,
  stdinValue = '',
  onRunSuccess,
  challengePrompt,
  presets,
}: CodeCompilerProps) {
  const [stdin, setStdin] = useState(stdinValue);
  const [showStdin, setShowStdin] = useState(Boolean(stdinValue));
  const [outputTab, setOutputTab] = useState<'console' | 'heap' | 'files'>('console');
  const [syntax, setSyntax] = useState<SyntaxCheckResult>(() => checkCSyntax(code));
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [virtualFiles, setVirtualFiles] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync default stdin when switching lessons
  useEffect(() => {
    setStdin(stdinValue);
    setShowStdin(Boolean(stdinValue));
    setExecResult(null);
  }, [stdinValue, starterCode]);

  // Real-time syntax check (debounced 220ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSyntax(checkCSyntax(code));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [code]);

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);

  const handleRun = () => {
    const res = runCProgram(code, stdin, virtualFiles);
    setExecResult(res);
    setVirtualFiles(res.files);
    if (res.success && onRunSuccess) {
      onRunSuccess();
    }
    // Auto-switch to Console on error or if output was produced
    if (!res.success) {
      setOutputTab('console');
    }
  };

  const handleReset = () => {
    if (starterCode !== undefined) {
      onChange(starterCode);
      setExecResult(null);
    }
  };

  const handleClearConsole = () => {
    setExecResult(null);
  };

  const handleScrollSync = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const insertAtCursor = (text: string, cursorOffset = 0) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(code + text);
      return;
    }
    const start = el.selectionStart ?? code.length;
    const end = el.selectionEnd ?? code.length;
    const next = code.slice(0, start) + text + code.slice(end);
    onChange(next);
    const nextPos = start + text.length + cursorOffset;
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('    ');
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const errorCount = syntax.diagnostics.filter((d) => d.severity === 'error').length;
  const heapCount = execResult?.heapBlocks.length ?? 0;
  const fileEntries = Object.entries(virtualFiles);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              main.c
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          {errorCount === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Syntax ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 whitespace-nowrap">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowStdin((s) => !s)}
            className={`min-h-[40px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              showStdin
                ? 'border-sky-600 bg-sky-50 text-sky-800 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-200'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Stdin
          </button>

          {starterCode !== undefined && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset to starter code"
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRun}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 active:scale-[0.98] transition-all whitespace-nowrap dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Compile & Run
          </button>
        </div>
      </div>

      {/* Optional Playground Presets */}
      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mr-1">
            Templates:
          </span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                onChange(p.code);
                setStdin(p.stdin ?? '');
                setShowStdin(Boolean(p.stdin));
                setExecResult(null);
              }}
              className="min-h-[34px] rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Challenge Callout */}
      {challengePrompt && (
        <div className="border-b border-slate-200 bg-sky-50/50 px-3.5 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-sky-950/20 dark:text-slate-300">
          <span className="font-semibold text-sky-800 dark:text-sky-300">Lab Task: </span>
          {challengePrompt}
        </div>
      )}

      {/* Code Editor with synchronized line numbers */}
      <div className="relative flex bg-slate-950 text-slate-100 min-h-[260px] max-h-[380px]">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden border-r border-slate-800 bg-slate-900/70 py-3 px-2.5 text-right font-mono text-xs leading-6 text-slate-500 tabular-nums w-11 shrink-0"
        >
          {Array.from({ length: lineCount }, (_, idx) => {
            const lineNum = idx + 1;
            const hasErr = syntax.diagnostics.some(
              (d) => d.line === lineNum && d.severity === 'error'
            );
            return (
              <div
                key={lineNum}
                className={hasErr ? 'text-red-400 font-semibold' : undefined}
              >
                {lineNum}
              </div>
            );
          })}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScrollSync}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="C source code editor"
          className="code-editor w-full resize-none bg-transparent py-3 px-3 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none overflow-auto"
          rows={12}
        />
      </div>

      {/* Mobile-friendly C Symbol Accessory Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800 bg-slate-900 px-2.5 py-1.5">
        {MOBILE_SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            type="button"
            onClick={() => insertAtCursor(sym.insert, sym.cursorOffset ?? 0)}
            className="min-h-[36px] min-w-[36px] rounded-md border border-slate-700 bg-slate-800 px-2.5 font-mono text-xs font-medium text-slate-200 hover:bg-slate-700 active:bg-sky-700 whitespace-nowrap shrink-0 transition-colors"
          >
            {sym.label}
          </button>
        ))}
      </div>

      {/* Optional Stdin Box */}
      {showStdin && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <label
            htmlFor="c-stdin-input"
            className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            Standard Input (stdin for scanf, space or newline separated)
          </label>
          <input
            id="c-stdin-input"
            type="text"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="e.g. 10 25"
            className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      {/* Live Syntax Diagnostics Bar (if any errors/warnings while typing) */}
      {syntax.diagnostics.length > 0 && (
        <div className="border-t border-slate-200 bg-amber-50/60 px-3 py-2 space-y-1 dark:border-slate-800 dark:bg-amber-950/20">
          {syntax.diagnostics.slice(0, 3).map((d, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 text-xs ${
                d.severity === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <span className="font-mono font-semibold">Line {d.line}:</span> {d.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Output & Inspector Tabs */}
      <div className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOutputTab('console')}
              className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                outputTab === 'console'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Console Output
            </button>
            <button
              type="button"
              onClick={() => setOutputTab('heap')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                outputTab === 'heap'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              Heap ({heapCount})
            </button>
            <button
              type="button"
              onClick={() => setOutputTab('files')}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                outputTab === 'files'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Files ({fileEntries.length})
            </button>
          </div>

          {execResult && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="hidden sm:inline">{execResult.executionMs} ms</span>
              <button
                type="button"
                onClick={handleClearConsole}
                aria-label="Clear output"
                className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Body */}
        <div className="min-h-[130px] max-h-[240px] overflow-auto p-3.5 font-mono text-xs">
          {outputTab === 'console' && (
            <>
              {!execResult ? (
                <p className="text-slate-500 dark:text-slate-400 font-sans">
                  Press <span className="font-semibold text-slate-700 dark:text-slate-200">Compile &amp; Run</span> to execute your C code in real time.
                </p>
              ) : (
                <div className="space-y-2">
                  {execResult.output ? (
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-slate-100">
                      {execResult.output}
                    </pre>
                  ) : (
                    execResult.success && (
                      <p className="text-slate-500 dark:text-slate-400 font-sans">
                        Program finished with no stdout output.
                      </p>
                    )
                  )}

                  {execResult.diagnostics.map((d, idx) => (
                    <div
                      key={idx}
                      className={`rounded-md border px-2.5 py-1.5 font-sans text-xs ${
                        d.severity === 'error'
                          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      <span className="font-mono font-semibold">Line {d.line}: </span>
                      {d.message}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Process exited with code {execResult.exitCode}
                    </span>
                    <span className="tabular-nums">{execResult.stepsExecuted} VM steps</span>
                  </div>
                </div>
              )}
            </>
          )}

          {outputTab === 'heap' && (
            <div>
              {heapCount === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 font-sans">
                  No dynamic heap allocations recorded in the last run. Use <code className="font-mono">malloc()</code>, <code className="font-mono">calloc()</code>, or <code className="font-mono">realloc()</code> to inspect heap blocks.
                </p>
              ) : (
                <table className="w-full text-left border-collapse tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-1.5 pr-3 font-medium">Address</th>
                      <th className="py-1.5 pr-3 font-medium">Allocator</th>
                      <th className="py-1.5 pr-3 font-medium">Bytes</th>
                      <th className="py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execResult?.heapBlocks.map((b, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                      >
                        <td className="py-1.5 pr-3 text-slate-800 dark:text-slate-200">
                          0x{b.address.toString(16)}
                        </td>
                        <td className="py-1.5 pr-3 text-sky-700 dark:text-sky-300">
                          {b.allocator}()
                        </td>
                        <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">
                          {b.size} B
                        </td>
                        <td className="py-1.5">
                          {b.freed ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Freed
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Active (unfreed)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {outputTab === 'files' && (
            <div className="space-y-3">
              {fileEntries.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 font-sans">
                  No virtual files created yet. Run a program with <code className="font-mono">fopen(&quot;notes.txt&quot;, &quot;w&quot;)</code> to store and inspect files here.
                </p>
              ) : (
                fileEntries.map(([fname, content]) => (
                  <div
                    key={fname}
                    className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-sky-700 dark:text-sky-300">{fname}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVirtualFiles((prev) => {
                            const copy = { ...prev };
                            delete copy[fname];
                            return copy;
                          });
                        }}
                        className="text-[11px] font-sans text-slate-500 hover:text-red-600 dark:text-slate-400"
                      >
                        Delete
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                      {content || '(empty file)'}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
