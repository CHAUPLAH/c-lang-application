import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Cpu, FileCode2, Layers } from 'lucide-react';

export function MemoryLayoutVisualizer() {
  const segments = [
    {
      id: 'stack',
      name: 'Stack',
      addrRange: '0x7FFF... (High)',
      growth: 'Grows downward ↓',
      lifetime: 'Automatic (per function call)',
      example: 'int localVar = 10; function parameters, return addresses',
      tone: 'text-sky-700 dark:text-sky-300',
    },
    {
      id: 'heap',
      name: 'Heap',
      addrRange: '0x5000... (Dynamic)',
      growth: 'Grows upward ↑',
      lifetime: 'Manual until free()',
      example: 'int *p = malloc(sizeof(int) * 10); calloc(), realloc()',
      tone: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'bss',
      name: 'BSS (Uninitialized Data)',
      addrRange: '0x1800...',
      growth: 'Fixed size',
      lifetime: 'Entire program run (zero-filled)',
      example: 'int globalCount; static int cache[100];',
      tone: 'text-amber-700 dark:text-amber-300',
    },
    {
      id: 'data',
      name: 'Initialized Data',
      addrRange: '0x1000...',
      growth: 'Fixed size',
      lifetime: 'Entire program run',
      example: 'int maxUsers = 50; static char mode = \'A\';',
      tone: 'text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'text',
      name: 'Text (Code)',
      addrRange: '0x0400... (Low)',
      growth: 'Read-only fixed',
      lifetime: 'Entire program run',
      example: 'Compiled machine instructions of main() and helpers',
      tone: 'text-slate-700 dark:text-slate-300',
    },
  ];

  const [selectedId, setSelectedId] = useState('stack');
  const active = segments.find((s) => s.id === selectedId) ?? segments[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Interactive C Memory Layout
          </h4>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tap a segment to inspect
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
        <div className="flex flex-col gap-1.5">
          {segments.map((seg) => {
            const isSelected = seg.id === selectedId;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => setSelectedId(seg.id)}
                className={`min-h-[44px] w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/70 dark:border-sky-400 dark:bg-sky-950/40'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`text-sm font-medium ${isSelected ? seg.tone : 'text-slate-800 dark:text-slate-200'}`}>
                  {seg.name}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {seg.addrRange}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-base font-semibold ${active.tone}`}>
                {active.name}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {active.id === 'stack' && <ArrowDown className="h-3.5 w-3.5" />}
                {active.id === 'heap' && <ArrowUp className="h-3.5 w-3.5" />}
                {active.growth}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Lifetime: <span className="font-medium text-slate-900 dark:text-slate-200">{active.lifetime}</span>
            </p>
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {active.example}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Address Space: <span className="font-mono">{active.addrRange}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function BitConverterLab() {
  const [value, setValue] = useState<number>(-5);

  // Convert signed 8-bit integer (-128..127) to 8-bit unsigned pattern
  const byte = value & 0xff;
  const bits = Array.from({ length: 8 }, (_, idx) => (byte >> (7 - idx)) & 1);
  const absMag = Math.abs(value) & 0x7f;
  const magBinary = absMag.toString(2).padStart(8, '0');
  const onesComp = value >= 0 ? magBinary : magBinary.split('').map((b) => (b === '0' ? '1' : '0')).join('');
  const twosComp = bits.join('');

  const toggleBit = (bitPosFromLeft: number) => {
    const mask = 1 << (7 - bitPosFromLeft);
    const nextByte = byte ^ mask;
    // Interpret as signed 8-bit
    const signed = nextByte >= 128 ? nextByte - 256 : nextByte;
    setValue(signed);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            8-Bit Signed Complement & Base Lab
          </h4>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tap bits or drag slider (-128 to 127)
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="bit-slider" className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Signed Value: <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300 tabular-nums">{value}</span>
          </label>
          <input
            id="bit-slider"
            type="range"
            min={-128}
            max={127}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer h-6"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setValue((v) => Math.max(-128, v - 1))}
              className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Decrement value"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => setValue((v) => Math.min(127, v + 1))}
              className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Increment value"
            >
              +1
            </button>
          </div>
        </div>

        {/* Clickable 8 bits */}
        <div>
          <div className="grid grid-cols-8 gap-1.5">
            {bits.map((bit, idx) => {
              const weight = idx === 0 ? '-128' : String(1 << (7 - idx));
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleBit(idx)}
                  className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg border font-mono transition-colors ${
                    bit === 1
                      ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-600'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold tabular-nums">{bit}</span>
                  <span className={`text-[10px] tabular-nums ${bit === 1 ? 'text-sky-100' : 'text-slate-400'}`}>
                    {weight}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            MSB (leftmost bit) has weight -128 in 8-bit 2&apos;s complement.
          </p>
        </div>

        {/* Base & Complement Readout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">1&apos;s Complement</div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {onesComp}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">2&apos;s Complement</div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
              {twosComp}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Octal (8-bit)</div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              0{byte.toString(8).padStart(3, '0')}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Hexadecimal</div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              0x{byte.toString(16).toUpperCase().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompilationFlowVisualizer() {
  const stages = [
    {
      id: 'prep',
      step: '1. Preprocessor',
      ext: 'main.c → main.i',
      desc: 'Expands #include headers, substitutes #define macros, and strips comments.',
      sample: `#define PI 3\n// comment stripped\nint r = PI;  ==>  int r = 3;`,
    },
    {
      id: 'comp',
      step: '2. Compiler',
      ext: 'main.i → main.s',
      desc: 'Checks syntax & types, then translates C statements into CPU assembly instructions.',
      sample: `int x = 3 + 4;\n  ==>  mov eax, 7\n       mov [rbp-4], eax`,
    },
    {
      id: 'asm',
      step: '3. Assembler',
      ext: 'main.s → main.o',
      desc: 'Converts assembly mnemonics into relocatable binary machine opcodes (object file).',
      sample: `mov eax, 7  ==>  B8 07 00 00 00`,
    },
    {
      id: 'link',
      step: '4. Linker',
      ext: 'main.o + libc → app',
      desc: 'Resolves external library symbols like printf() from libc and produces the executable.',
      sample: `call printf@PLT  ==>  linked to stdio in libc.so`,
    },
  ];

  const [activeId, setActiveId] = useState('prep');
  const current = stages.find((s) => s.id === activeId) ?? stages[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            C Compilation Flow Explorer
          </h4>
        </div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {current.ext}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((st) => {
          const active = st.id === activeId;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveId(st.id)}
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-sky-600 bg-sky-50/70 text-sky-900 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              <div className="text-xs font-semibold whitespace-nowrap truncate">{st.step}</div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">{st.ext}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{current.desc}</p>
        <pre className="mt-2.5 overflow-x-auto rounded-md bg-slate-900 p-2.5 font-mono text-xs text-slate-100">
          {current.sample}
        </pre>
      </div>
    </div>
  );
}
