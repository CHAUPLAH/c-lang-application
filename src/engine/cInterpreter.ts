// Client-side C99 subset compiler, virtual memory machine, and real-time syntax checker.
// Runs 100% in the browser (offline-capable, zero external APIs, instant feedback).

export interface CompilerDiagnostic {
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface HeapBlockInfo {
  address: number;
  size: number;
  freed: boolean;
  allocator: 'malloc' | 'calloc' | 'realloc';
  line: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  diagnostics: CompilerDiagnostic[];
  heapBlocks: HeapBlockInfo[];
  files: Record<string, string>;
  stepsExecuted: number;
  executionMs: number;
  exitCode: number;
}

export interface SyntaxCheckResult {
  valid: boolean;
  diagnostics: CompilerDiagnostic[];
  headers: string[];
  macros: string[];
  functions: string[];
}

// ---------------- Types ----------------

type BaseType =
  | { kind: 'void' }
  | { kind: 'char'; unsigned?: boolean }
  | { kind: 'short'; unsigned?: boolean }
  | { kind: 'int'; unsigned?: boolean }
  | { kind: 'long'; unsigned?: boolean }
  | { kind: 'float' }
  | { kind: 'double' }
  | { kind: 'struct'; name: string }
  | { kind: 'union'; name: string }
  | { kind: 'file' }
  | { kind: 'pointer'; to: BaseType }
  | { kind: 'array'; of: BaseType; length: number }
  | { kind: 'funcptr'; returnType: BaseType; params: BaseType[] };

interface FieldDef {
  name: string;
  type: BaseType;
  offset: number;
  size: number;
}

interface CompositeDef {
  kind: 'struct' | 'union';
  name: string;
  fields: FieldDef[];
  size: number;
}

interface Token {
  type: 'keyword' | 'ident' | 'number' | 'string' | 'char' | 'op' | 'punct' | 'eof';
  value: string;
  line: number;
  col: number;
}

// ---------------- Preprocessor & Lexer ----------------

const KEYWORDS = new Set([
  'int', 'float', 'double', 'char', 'void', 'long', 'short', 'unsigned', 'signed',
  'const', 'static', 'struct', 'union', 'typedef', 'if', 'else', 'switch', 'case',
  'default', 'while', 'do', 'for', 'break', 'continue', 'goto', 'return', 'sizeof',
  'FILE', 'NULL',
]);

interface PreprocessResult {
  code: string;
  headers: string[];
  macros: Map<string, string>;
  diagnostics: CompilerDiagnostic[];
}

function preprocess(source: string): PreprocessResult {
  const headers: string[] = [];
  const macros = new Map<string, string>();
  const diagnostics: CompilerDiagnostic[] = [];

  // Strip comments while preserving line numbers
  let cleaned = '';
  let i = 0;
  let line = 1;
  let inStr = false;
  let inChar = false;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (inStr) {
      cleaned += ch;
      if (ch === '\\' && i + 1 < source.length) {
        cleaned += source[i + 1];
        if (source[i + 1] === '\n') line++;
        i += 2;
        continue;
      }
      if (ch === '"') inStr = false;
      if (ch === '\n') line++;
      i++;
      continue;
    }

    if (inChar) {
      cleaned += ch;
      if (ch === '\\' && i + 1 < source.length) {
        cleaned += source[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") inChar = false;
      if (ch === '\n') line++;
      i++;
      continue;
    }

    if (ch === '"') {
      inStr = true;
      cleaned += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inChar = true;
      cleaned += ch;
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      const startLine = line;
      i += 2;
      let closed = false;
      while (i < source.length) {
        if (source[i] === '*' && source[i + 1] === '/') {
          i += 2;
          closed = true;
          break;
        }
        if (source[i] === '\n') {
          cleaned += '\n';
          line++;
        }
        i++;
      }
      if (!closed) {
        diagnostics.push({
          line: startLine,
          column: 1,
          severity: 'error',
          message: 'Unterminated block comment /* ... */',
        });
      }
      continue;
    }

    if (ch === '\n') line++;
    cleaned += ch;
    i++;
  }

  // Process preprocessor directives line-by-line
  const lines = cleaned.split('\n');
  const outLines: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const trimmed = raw.trim();
    if (trimmed.startsWith('#')) {
      const incMatch = trimmed.match(/^#\s*include\s*[<"]([^>"]+)[>"]/);
      if (incMatch) {
        headers.push(incMatch[1]);
      } else {
        const defMatch = trimmed.match(/^#\s*define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
        if (defMatch) {
          macros.set(defMatch[1], defMatch[2].trim());
        }
      }
      outLines.push(''); // preserve exact line numbering
    } else {
      outLines.push(raw);
    }
  }

  return {
    code: outLines.join('\n'),
    headers,
    macros,
    diagnostics,
  };
}

function tokenize(code: string, macros: Map<string, string>, diagnostics: CompilerDiagnostic[]): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const multiOps = [
    '++', '--', '->', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||',
    '+=', '-=', '*=', '/=', '%=',
  ];
  const singleOps = new Set(['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', ':', '.', ',']);
  const puncts = new Set(['(', ')', '{', '}', '[', ']', ';']);

  const advance = (count = 1) => {
    for (let k = 0; k < count; k++) {
      if (code[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < code.length) {
    const ch = code[i];
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    const startLine = line;
    const startCol = col;

    // String literal
    if (ch === '"') {
      advance();
      let str = '';
      let closed = false;
      while (i < code.length) {
        if (code[i] === '\n') break;
        if (code[i] === '"') {
          advance();
          closed = true;
          break;
        }
        if (code[i] === '\\' && i + 1 < code.length) {
          const esc = code[i + 1];
          advance(2);
          switch (esc) {
            case 'n': str += '\n'; break;
            case 't': str += '\t'; break;
            case 'r': str += '\r'; break;
            case '0': str += '\0'; break;
            case '\\': str += '\\'; break;
            case '"': str += '"'; break;
            case "'": str += "'"; break;
            default: str += esc;
          }
        } else {
          str += code[i];
          advance();
        }
      }
      if (!closed) {
        diagnostics.push({
          line: startLine,
          column: startCol,
          severity: 'error',
          message: 'Unterminated string literal',
        });
      }
      tokens.push({ type: 'string', value: str, line: startLine, col: startCol });
      continue;
    }

    // Char literal
    if (ch === "'") {
      advance();
      let val = '';
      if (code[i] === '\\' && i + 1 < code.length) {
        const esc = code[i + 1];
        advance(2);
        switch (esc) {
          case 'n': val = '\n'; break;
          case 't': val = '\t'; break;
          case '0': val = '\0'; break;
          case '\\': val = '\\'; break;
          case "'": val = "'"; break;
          default: val = esc;
        }
      } else if (i < code.length && code[i] !== "'") {
        val = code[i];
        advance();
      }
      if (code[i] === "'") {
        advance();
      } else {
        diagnostics.push({
          line: startLine,
          column: startCol,
          severity: 'error',
          message: 'Unterminated character literal',
        });
      }
      tokens.push({ type: 'char', value: val, line: startLine, col: startCol });
      continue;
    }

    // Number literal
    if (/[0-9]/.test(ch)) {
      let num = '';
      if (ch === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        num += code[i] + code[i + 1];
        advance(2);
        while (i < code.length && /[0-9a-fA-F]/.test(code[i])) {
          num += code[i];
          advance();
        }
      } else if (ch === '0' && (code[i + 1] === 'b' || code[i + 1] === 'B')) {
        num += code[i] + code[i + 1];
        advance(2);
        while (i < code.length && /[01]/.test(code[i])) {
          num += code[i];
          advance();
        }
      } else {
        while (i < code.length && /[0-9]/.test(code[i])) {
          num += code[i];
          advance();
        }
        if (code[i] === '.' && /[0-9]/.test(code[i + 1] || '')) {
          num += '.';
          advance();
          while (i < code.length && /[0-9]/.test(code[i])) {
            num += code[i];
            advance();
          }
        }
        if (code[i] === 'f' || code[i] === 'F' || code[i] === 'l' || code[i] === 'L') {
          advance();
        }
      }
      tokens.push({ type: 'number', value: num, line: startLine, col: startCol });
      continue;
    }

    // Identifier / Keyword / Macro
    if (/[A-Za-z_]/.test(ch)) {
      let ident = '';
      while (i < code.length && /[A-Za-z0-9_]/.test(code[i])) {
        ident += code[i];
        advance();
      }
      if (macros.has(ident)) {
        const replacement = macros.get(ident)!;
        const subTokens = tokenize(replacement, new Map(), diagnostics);
        for (const st of subTokens) {
          if (st.type !== 'eof') {
            tokens.push({ ...st, line: startLine, col: startCol });
          }
        }
      } else if (KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident, line: startLine, col: startCol });
      } else {
        tokens.push({ type: 'ident', value: ident, line: startLine, col: startCol });
      }
      continue;
    }

    // Multi-char operators
    const two = code.slice(i, i + 2);
    if (multiOps.includes(two)) {
      tokens.push({ type: 'op', value: two, line: startLine, col: startCol });
      advance(2);
      continue;
    }

    if (singleOps.has(ch)) {
      tokens.push({ type: 'op', value: ch, line: startLine, col: startCol });
      advance();
      continue;
    }

    if (puncts.has(ch)) {
      tokens.push({ type: 'punct', value: ch, line: startLine, col: startCol });
      advance();
      continue;
    }

    diagnostics.push({
      line: startLine,
      column: startCol,
      severity: 'error',
      message: `Unexpected character '${ch}'`,
    });
    advance();
  }

  tokens.push({ type: 'eof', value: '', line, col });
  return tokens;
}

// ---------------- AST Nodes ----------------

type Expr =
  | { kind: 'number'; value: number; isFloat: boolean; line: number }
  | { kind: 'char'; value: number; line: number }
  | { kind: 'string'; value: string; line: number }
  | { kind: 'null'; line: number }
  | { kind: 'ident'; name: string; line: number }
  | { kind: 'unary'; op: string; expr: Expr; prefix: boolean; line: number }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; line: number }
  | { kind: 'ternary'; cond: Expr; thenExpr: Expr; elseExpr: Expr; line: number }
  | { kind: 'cast'; targetType: BaseType; expr: Expr; line: number }
  | { kind: 'sizeofType'; targetType: BaseType; line: number }
  | { kind: 'sizeofExpr'; expr: Expr; line: number }
  | { kind: 'call'; callee: Expr; args: Expr[]; line: number }
  | { kind: 'index'; target: Expr; index: Expr; line: number }
  | { kind: 'member'; target: Expr; field: string; arrow: boolean; line: number }
  | { kind: 'initList'; items: Expr[]; line: number };

interface VarDeclItem {
  name: string;
  type: BaseType;
  init?: Expr;
  isStatic: boolean;
  line: number;
}

type Stmt =
  | { kind: 'empty'; line: number }
  | { kind: 'block'; stmts: Stmt[]; line: number }
  | { kind: 'varDecl'; items: VarDeclItem[]; line: number }
  | { kind: 'expr'; expr: Expr; line: number }
  | { kind: 'if'; cond: Expr; thenStmt: Stmt; elseStmt?: Stmt; line: number }
  | { kind: 'switch'; expr: Expr; cases: { value?: Expr; stmts: Stmt[]; isDefault: boolean; line: number }[]; line: number }
  | { kind: 'while'; cond: Expr; body: Stmt; line: number }
  | { kind: 'doWhile'; body: Stmt; cond: Expr; line: number }
  | { kind: 'for'; init?: Stmt; cond?: Expr; update?: Expr; body: Stmt; line: number }
  | { kind: 'break'; line: number }
  | { kind: 'continue'; line: number }
  | { kind: 'goto'; label: string; line: number }
  | { kind: 'label'; label: string; stmt: Stmt; line: number }
  | { kind: 'return'; expr?: Expr; line: number };

interface FuncParam {
  name: string;
  type: BaseType;
}

interface FuncDef {
  name: string;
  returnType: BaseType;
  params: FuncParam[];
  body: Stmt;
  isStatic: boolean;
  line: number;
}

interface ProgramAST {
  composites: Map<string, CompositeDef>;
  typedefs: Map<string, BaseType>;
  globals: VarDeclItem[];
  functions: Map<string, FuncDef>;
  prototypes: Set<string>;
}

// ---------------- Parser ----------------

class Parser {
  private pos = 0;
  public diagnostics: CompilerDiagnostic[] = [];
  private typedefs = new Map<string, BaseType>();
  private composites = new Map<string, CompositeDef>();

  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private advance(): Token {
    const t = this.peek();
    if (this.pos < this.tokens.length - 1) this.pos++;
    return t;
  }

  private check(value: string): boolean {
    return this.peek().value === value;
  }

  private match(value: string): boolean {
    if (this.check(value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(value: string, msg?: string): Token {
    if (this.check(value)) return this.advance();
    const t = this.peek();
    this.error(t.line, t.col, msg || `Expected '${value}' before '${t.value || 'end of file'}'`);
    return t;
  }

  private error(line: number, col: number, message: string) {
    // Avoid spamming duplicate errors on the exact same line
    if (!this.diagnostics.some((d) => d.line === line && d.message === message)) {
      this.diagnostics.push({ line, column: col, severity: 'error', message });
    }
  }

  private isTypeStart(offset = 0): boolean {
    const t = this.peek(offset);
    if (t.type === 'keyword') {
      return [
        'int', 'float', 'double', 'char', 'void', 'long', 'short',
        'unsigned', 'signed', 'const', 'static', 'struct', 'union', 'FILE',
      ].includes(t.value);
    }
    if (t.type === 'ident' && this.typedefs.has(t.value)) return true;
    return false;
  }

  private computeCompositeLayout(kind: 'struct' | 'union', name: string, rawFields: { name: string; type: BaseType }[]): CompositeDef {
    const fields: FieldDef[] = [];
    let offset = 0;
    let maxSize = 0;
    for (const f of rawFields) {
      const sz = this.sizeOf(f.type);
      if (kind === 'struct') {
        fields.push({ name: f.name, type: f.type, offset, size: sz });
        offset += sz;
      } else {
        fields.push({ name: f.name, type: f.type, offset: 0, size: sz });
        if (sz > maxSize) maxSize = sz;
      }
    }
    const def: CompositeDef = {
      kind,
      name,
      fields,
      size: Math.max(1, kind === 'struct' ? offset : maxSize),
    };
    if (name) this.composites.set(`${kind}:${name}`, def);
    return def;
  }

  public sizeOf(t: BaseType): number {
    switch (t.kind) {
      case 'void': return 1;
      case 'char': return 1;
      case 'short': return 2;
      case 'int': return 4;
      case 'long': return 4;
      case 'float': return 4;
      case 'double': return 8;
      case 'pointer':
      case 'file':
      case 'funcptr': return 4;
      case 'array': return Math.max(1, t.length) * this.sizeOf(t.of);
      case 'struct':
      case 'union': {
        const def = this.composites.get(`${t.kind}:${t.name}`);
        return def ? def.size : 4;
      }
    }
  }

  private parseBaseType(): { type: BaseType; isStatic: boolean } {
    let isStatic = false;
    let isUnsigned = false;
    let base: BaseType | null = null;

    while (true) {
      const t = this.peek();
      if (t.value === 'static') {
        isStatic = true;
        this.advance();
      } else if (t.value === 'const' || t.value === 'signed') {
        this.advance();
      } else if (t.value === 'unsigned') {
        isUnsigned = true;
        this.advance();
      } else if (t.value === 'long' || t.value === 'short') {
        const kw = this.advance().value;
        if (this.peek().value === 'int') this.advance();
        base = { kind: kw === 'short' ? 'short' : 'long', unsigned: isUnsigned };
        break;
      } else if (t.value === 'int') {
        this.advance();
        base = { kind: 'int', unsigned: isUnsigned };
        break;
      } else if (t.value === 'char') {
        this.advance();
        base = { kind: 'char', unsigned: isUnsigned };
        break;
      } else if (t.value === 'float') {
        this.advance();
        base = { kind: 'float' };
        break;
      } else if (t.value === 'double') {
        this.advance();
        base = { kind: 'double' };
        break;
      } else if (t.value === 'void') {
        this.advance();
        base = { kind: 'void' };
        break;
      } else if (t.value === 'FILE') {
        this.advance();
        base = { kind: 'file' };
        break;
      } else if (t.value === 'struct' || t.value === 'union') {
        const kind = this.advance().value as 'struct' | 'union';
        let name = '';
        if (this.peek().type === 'ident') {
          name = this.advance().value;
        }
        if (this.match('{')) {
          const rawFields: { name: string; type: BaseType }[] = [];
          while (!this.check('}') && this.peek().type !== 'eof') {
            const { type: fBase } = this.parseBaseType();
            do {
              const decl = this.parseDeclarator(fBase);
              rawFields.push({ name: decl.name, type: decl.type });
            } while (this.match(','));
            this.expect(';', 'Expected ; after struct/union field');
          }
          this.expect('}');
          const anonName = name || `__anon_${this.composites.size}`;
          this.computeCompositeLayout(kind, anonName, rawFields);
          base = { kind, name: anonName };
        } else {
          base = { kind, name };
        }
        break;
      } else if (t.type === 'ident' && this.typedefs.has(t.value)) {
        base = this.typedefs.get(this.advance().value)!;
        break;
      } else {
        break;
      }
    }

    if (!base) {
      base = { kind: 'int', unsigned: isUnsigned };
    }
    return { type: base, isStatic };
  }

  private parseDeclarator(base: BaseType): { name: string; type: BaseType; funcParams?: FuncParam[] } {
    let type = base;
    while (this.match('*')) {
      type = { kind: 'pointer', to: type };
    }

    // Function pointer: (*fp)(int, int)
    if (this.check('(') && this.peek(1).value === '*') {
      this.advance(); // (
      this.advance(); // *
      let name = '';
      if (this.peek().type === 'ident') {
        name = this.advance().value;
      }
      this.expect(')');
      this.expect('(');
      const paramTypes: BaseType[] = [];
      if (!this.check(')')) {
        do {
          const { type: pt } = this.parseBaseType();
          const pDecl = this.parseAbstractOrNamedParam(pt);
          paramTypes.push(pDecl.type);
        } while (this.match(','));
      }
      this.expect(')');
      return {
        name,
        type: { kind: 'funcptr', returnType: type, params: paramTypes },
      };
    }

    let name = '';
    if (this.peek().type === 'ident') {
      name = this.advance().value;
    }

    // Check function parameters
    if (this.check('(')) {
      this.advance();
      const params: FuncParam[] = [];
      if (!this.check(')')) {
        if (this.peek().value === 'void' && this.peek(1).value === ')') {
          this.advance();
        } else {
          do {
            const { type: pt } = this.parseBaseType();
            const pDecl = this.parseAbstractOrNamedParam(pt);
            params.push({ name: pDecl.name, type: pDecl.type });
          } while (this.match(','));
        }
      }
      this.expect(')');
      return { name, type, funcParams: params };
    }

    // Array dimensions
    const dims: number[] = [];
    while (this.match('[')) {
      if (this.check(']')) {
        dims.push(-1); // unsized e.g. int arr[] = {1,2,3} or parameter int arr[]
        this.advance();
      } else {
        const sizeTok = this.peek();
        let len = 1;
        if (sizeTok.type === 'number') {
          len = Math.max(1, parseInt(this.advance().value, 10) || 1);
        } else {
          // Consume simple expression
          this.parseExpression();
          len = 10;
        }
        dims.push(len);
        this.expect(']');
      }
    }
    for (let d = dims.length - 1; d >= 0; d--) {
      type = { kind: 'array', of: type, length: dims[d] };
    }

    return { name, type };
  }

  private parseAbstractOrNamedParam(base: BaseType): { name: string; type: BaseType } {
    let type = base;
    while (this.match('*')) {
      type = { kind: 'pointer', to: type };
    }
    let name = '';
    if (this.peek().type === 'ident') {
      name = this.advance().value;
    }
    const dims: number[] = [];
    while (this.match('[')) {
      if (this.check(']')) {
        dims.push(-1);
        this.advance();
      } else {
        const numTok = this.peek();
        let len = 1;
        if (numTok.type === 'number') {
          len = Math.max(1, parseInt(this.advance().value, 10) || 1);
        } else {
          this.parseExpression();
        }
        dims.push(len);
        this.expect(']');
      }
    }
    // In C, array parameters decay to pointers (for 1D) or pointer to subarray
    if (dims.length > 0) {
      let inner = type;
      for (let d = dims.length - 1; d >= 1; d--) {
        inner = { kind: 'array', of: inner, length: dims[d] };
      }
      type = { kind: 'pointer', to: inner };
    }
    return { name, type };
  }

  public parseProgram(): ProgramAST {
    const ast: ProgramAST = {
      composites: this.composites,
      typedefs: this.typedefs,
      globals: [],
      functions: new Map(),
      prototypes: new Set(),
    };

    while (this.peek().type !== 'eof') {
      const startPos = this.pos;
      const t = this.peek();

      if (t.value === ';') {
        this.advance();
        continue;
      }

      if (t.value === 'typedef') {
        this.advance();
        const { type: base } = this.parseBaseType();
        const decl = this.parseDeclarator(base);
        if (decl.name) {
          this.typedefs.set(decl.name, decl.type);
        }
        this.expect(';', 'Expected ; after typedef');
        continue;
      }

      const { type: base, isStatic } = this.parseBaseType();
      // Struct/union definition without variable e.g. struct Point { int x; int y; };
      if (this.match(';')) {
        continue;
      }

      const firstDecl = this.parseDeclarator(base);
      if (firstDecl.funcParams !== undefined) {
        if (this.check('{')) {
          const body = this.parseBlock();
          ast.functions.set(firstDecl.name, {
            name: firstDecl.name,
            returnType: firstDecl.type,
            params: firstDecl.funcParams,
            body,
            isStatic,
            line: t.line,
          });
        } else {
          ast.prototypes.add(firstDecl.name);
          this.expect(';', 'Expected ; or { after function declaration');
        }
        continue;
      }

      // Global variable declaration(s)
      const items: VarDeclItem[] = [];
      let currentDecl = firstDecl;
      while (true) {
        let init: Expr | undefined;
        if (this.match('=')) {
          init = this.parseInitializer();
        }
        items.push({
          name: currentDecl.name,
          type: currentDecl.type,
          init,
          isStatic,
          line: t.line,
        });
        if (!this.match(',')) break;
        currentDecl = this.parseDeclarator(base);
      }
      this.expect(';', 'Expected ; after global declaration');
      ast.globals.push(...items);

      if (this.pos === startPos) {
        this.error(this.peek().line, this.peek().col, `Unexpected token '${this.peek().value}'`);
        this.advance();
      }
    }

    return ast;
  }

  private parseInitializer(): Expr {
    if (this.match('{')) {
      const line = this.peek().line;
      const items: Expr[] = [];
      while (!this.check('}') && this.peek().type !== 'eof') {
        items.push(this.parseInitializer());
        if (!this.match(',')) break;
      }
      this.expect('}');
      return { kind: 'initList', items, line };
    }
    return this.parseAssignment();
  }

  private parseBlock(): Stmt {
    const start = this.expect('{');
    const stmts: Stmt[] = [];
    while (!this.check('}') && this.peek().type !== 'eof') {
      const before = this.pos;
      stmts.push(this.parseStatement());
      if (this.pos === before) {
        this.advance();
      }
    }
    this.expect('}', 'Missing closing brace }');
    return { kind: 'block', stmts, line: start.line };
  }

  private parseStatement(): Stmt {
    const t = this.peek();

    if (this.match(';')) return { kind: 'empty', line: t.line };
    if (this.check('{')) return this.parseBlock();

    if (this.match('if')) {
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      const thenStmt = this.parseStatement();
      let elseStmt: Stmt | undefined;
      if (this.match('else')) {
        elseStmt = this.parseStatement();
      }
      return { kind: 'if', cond, thenStmt, elseStmt, line: t.line };
    }

    if (this.match('switch')) {
      this.expect('(');
      const expr = this.parseExpression();
      this.expect(')');
      this.expect('{');
      const cases: { value?: Expr; stmts: Stmt[]; isDefault: boolean; line: number }[] = [];
      while (!this.check('}') && this.peek().type !== 'eof') {
        const cTok = this.peek();
        if (this.match('case')) {
          const val = this.parseExpression();
          this.expect(':');
          const stmts: Stmt[] = [];
          while (!this.check('case') && !this.check('default') && !this.check('}') && this.peek().type !== 'eof') {
            stmts.push(this.parseStatement());
          }
          cases.push({ value: val, stmts, isDefault: false, line: cTok.line });
        } else if (this.match('default')) {
          this.expect(':');
          const stmts: Stmt[] = [];
          while (!this.check('case') && !this.check('default') && !this.check('}') && this.peek().type !== 'eof') {
            stmts.push(this.parseStatement());
          }
          cases.push({ stmts, isDefault: true, line: cTok.line });
        } else {
          this.error(cTok.line, cTok.col, `Expected 'case' or 'default' inside switch`);
          this.advance();
        }
      }
      this.expect('}');
      return { kind: 'switch', expr, cases, line: t.line };
    }

    if (this.match('while')) {
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      const body = this.parseStatement();
      return { kind: 'while', cond, body, line: t.line };
    }

    if (this.match('do')) {
      const body = this.parseStatement();
      this.expect('while');
      this.expect('(');
      const cond = this.parseExpression();
      this.expect(')');
      this.expect(';', 'Expected ; after do-while condition');
      return { kind: 'doWhile', body, cond, line: t.line };
    }

    if (this.match('for')) {
      this.expect('(');
      let init: Stmt | undefined;
      if (!this.check(';')) {
        if (this.isTypeStart()) {
          init = this.parseVarDeclStmt();
        } else {
          init = { kind: 'expr', expr: this.parseExpression(), line: this.peek().line };
          this.expect(';');
        }
      } else {
        this.advance();
      }
      let cond: Expr | undefined;
      if (!this.check(';')) {
        cond = this.parseExpression();
      }
      this.expect(';');
      let update: Expr | undefined;
      if (!this.check(')')) {
        update = this.parseExpression();
      }
      this.expect(')');
      const body = this.parseStatement();
      return { kind: 'for', init, cond, update, body, line: t.line };
    }

    if (this.match('break')) {
      this.expect(';', 'Expected ; after break');
      return { kind: 'break', line: t.line };
    }

    if (this.match('continue')) {
      this.expect(';', 'Expected ; after continue');
      return { kind: 'continue', line: t.line };
    }

    if (this.match('goto')) {
      const lbl = this.peek().type === 'ident' ? this.advance().value : '';
      this.expect(';', 'Expected ; after goto label');
      return { kind: 'goto', label: lbl, line: t.line };
    }

    if (this.match('return')) {
      let expr: Expr | undefined;
      if (!this.check(';')) {
        expr = this.parseExpression();
      }
      this.expect(';', 'Expected ; after return statement');
      return { kind: 'return', expr, line: t.line };
    }

    // Label statement: ident : stmt
    if (t.type === 'ident' && this.peek(1).value === ':') {
      const label = this.advance().value;
      this.advance(); // :
      const stmt = this.parseStatement();
      return { kind: 'label', label, stmt, line: t.line };
    }

    if (this.isTypeStart()) {
      return this.parseVarDeclStmt();
    }

    const expr = this.parseExpression();
    this.expect(';', 'Missing semicolon ;');
    return { kind: 'expr', expr, line: t.line };
  }

  private parseVarDeclStmt(): Stmt {
    const line = this.peek().line;
    const { type: base, isStatic } = this.parseBaseType();
    const items: VarDeclItem[] = [];
    while (true) {
      const decl = this.parseDeclarator(base);
      let init: Expr | undefined;
      if (this.match('=')) {
        init = this.parseInitializer();
      }
      items.push({ name: decl.name, type: decl.type, init, isStatic, line });
      if (!this.match(',')) break;
    }
    this.expect(';', 'Missing semicolon ; after declaration');
    return { kind: 'varDecl', items, line };
  }

  private parseExpression(): Expr {
    let expr = this.parseAssignment();
    while (this.match(',')) {
      const right = this.parseAssignment();
      expr = { kind: 'binary', op: ',', left: expr, right, line: expr.line };
    }
    return expr;
  }

  private parseAssignment(): Expr {
    const left = this.parseTernary();
    const t = this.peek();
    if (['=', '+=', '-=', '*=', '/=', '%='].includes(t.value)) {
      const op = this.advance().value;
      const right = this.parseAssignment();
      return { kind: 'binary', op, left, right, line: t.line };
    }
    return left;
  }

  private parseTernary(): Expr {
    const cond = this.parseLogicalOr();
    if (this.match('?')) {
      const thenExpr = this.parseExpression();
      this.expect(':');
      const elseExpr = this.parseTernary();
      return { kind: 'ternary', cond, thenExpr, elseExpr, line: cond.line };
    }
    return cond;
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.match('||')) {
      const right = this.parseLogicalAnd();
      left = { kind: 'binary', op: '||', left, right, line: left.line };
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseBitOr();
    while (this.match('&&')) {
      const right = this.parseBitOr();
      left = { kind: 'binary', op: '&&', left, right, line: left.line };
    }
    return left;
  }

  private parseBitOr(): Expr {
    let left = this.parseBitXor();
    while (this.match('|')) {
      const right = this.parseBitXor();
      left = { kind: 'binary', op: '|', left, right, line: left.line };
    }
    return left;
  }

  private parseBitXor(): Expr {
    let left = this.parseBitAnd();
    while (this.match('^')) {
      const right = this.parseBitAnd();
      left = { kind: 'binary', op: '^', left, right, line: left.line };
    }
    return left;
  }

  private parseBitAnd(): Expr {
    let left = this.parseEquality();
    while (this.match('&')) {
      const right = this.parseEquality();
      left = { kind: 'binary', op: '&', left, right, line: left.line };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (this.check('==') || this.check('!=')) {
      const op = this.advance().value;
      const right = this.parseRelational();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseShift();
    while (['<', '<=', '>', '>='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseShift();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseShift(): Expr {
    let left = this.parseAdditive();
    while (this.check('<<') || this.check('>>')) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check('+') || this.check('-')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.check('*') || this.check('/') || this.check('%')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseUnary(): Expr {
    const t = this.peek();

    // Type cast: (int)x, (float *)p
    if (t.value === '(' && this.isTypeStart(1)) {
      this.advance(); // (
      const { type: base } = this.parseBaseType();
      let targetType = base;
      while (this.match('*')) {
        targetType = { kind: 'pointer', to: targetType };
      }
      this.expect(')');
      const expr = this.parseUnary();
      return { kind: 'cast', targetType, expr, line: t.line };
    }

    if (this.match('sizeof')) {
      if (this.check('(') && this.isTypeStart(1)) {
        this.advance();
        const { type: base } = this.parseBaseType();
        let targetType = base;
        while (this.match('*')) {
          targetType = { kind: 'pointer', to: targetType };
        }
        this.expect(')');
        return { kind: 'sizeofType', targetType, line: t.line };
      }
      if (this.match('(')) {
        const inner = this.parseExpression();
        this.expect(')');
        return { kind: 'sizeofExpr', expr: inner, line: t.line };
      }
      const expr = this.parseUnary();
      return { kind: 'sizeofExpr', expr, line: t.line };
    }

    if (['++', '--', '+', '-', '!', '~', '*', '&'].includes(t.value)) {
      const op = this.advance().value;
      const expr = this.parseUnary();
      return { kind: 'unary', op, expr, prefix: true, line: t.line };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      const t = this.peek();
      if (this.match('(')) {
        const args: Expr[] = [];
        if (!this.check(')')) {
          do {
            args.push(this.parseAssignment());
          } while (this.match(','));
        }
        this.expect(')');
        expr = { kind: 'call', callee: expr, args, line: t.line };
      } else if (this.match('[')) {
        const index = this.parseExpression();
        this.expect(']');
        expr = { kind: 'index', target: expr, index, line: t.line };
      } else if (this.match('.')) {
        const field = this.advance().value;
        expr = { kind: 'member', target: expr, field, arrow: false, line: t.line };
      } else if (this.match('->')) {
        const field = this.advance().value;
        expr = { kind: 'member', target: expr, field, arrow: true, line: t.line };
      } else if (this.check('++') || this.check('--')) {
        const op = this.advance().value;
        expr = { kind: 'unary', op, expr, prefix: false, line: t.line };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === 'number') {
      this.advance();
      const isFloat = t.value.includes('.');
      let num: number;
      if (t.value.startsWith('0x') || t.value.startsWith('0X')) {
        num = parseInt(t.value, 16);
      } else if (t.value.startsWith('0b') || t.value.startsWith('0B')) {
        num = parseInt(t.value.slice(2), 2);
      } else if (t.value.startsWith('0') && t.value.length > 1 && !isFloat) {
        num = parseInt(t.value, 8);
      } else {
        num = isFloat ? parseFloat(t.value) : parseInt(t.value, 10);
      }
      return { kind: 'number', value: num, isFloat, line: t.line };
    }
    if (t.type === 'char') {
      this.advance();
      return { kind: 'char', value: t.value.charCodeAt(0) || 0, line: t.line };
    }
    if (t.type === 'string') {
      this.advance();
      // Concatenate adjacent string literals
      let combined = t.value;
      while (this.peek().type === 'string') {
        combined += this.advance().value;
      }
      return { kind: 'string', value: combined, line: t.line };
    }
    if (t.value === 'NULL') {
      this.advance();
      return { kind: 'null', line: t.line };
    }
    if (t.type === 'ident') {
      this.advance();
      return { kind: 'ident', name: t.value, line: t.line };
    }
    if (this.match('(')) {
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    }

    this.error(t.line, t.col, `Unexpected token '${t.value || 'EOF'}'`);
    this.advance();
    return { kind: 'number', value: 0, isFloat: false, line: t.line };
  }
}

// ---------------- Virtual Machine & Runtime ----------------

interface VarBinding {
  addr: number;
  type: BaseType;
}

interface RuntimeValue {
  val: number;
  type: BaseType;
  lvalueAddr?: number;
}

interface OpenFileHandle {
  filename: string;
  mode: string;
  cursor: number;
  content: string;
  closed: boolean;
}

class ControlSignal {
  constructor(
    public kind: 'break' | 'continue' | 'return' | 'goto',
    public value?: RuntimeValue,
    public label?: string
  ) {}
}

class RuntimeError extends Error {
  constructor(public line: number, message: string) {
    super(message);
  }
}

class VirtualMachine {
  private ram = new Uint8Array(65536);
  private view = new DataView(this.ram.buffer);

  private dataPtr = 0x1000;   // globals & static locals
  private stackPtr = 0x2000;  // stack variables
  private heapPtr = 0x5000;   // malloc / calloc / realloc
  private strPtr = 0xD000;    // string literals

  private globals = new Map<string, VarBinding>();
  private staticLocals = new Map<string, VarBinding>();
  private funcAddrs = new Map<string, string>(); // addr -> funcName
  private funcNameToAddr = new Map<string, number>();
  private stringPool = new Map<string, number>();

  public output = '';
  public heapBlocks: HeapBlockInfo[] = [];
  private files = new Map<string, string>();
  private openHandles = new Map<number, OpenFileHandle>();
  private nextHandleAddr = 0xE000;

  private stdinTokens: string[] = [];
  private stdinIndex = 0;

  private steps = 0;
  private readonly MAX_STEPS = 80000;

  constructor(private ast: ProgramAST, stdin: string, initialFiles: Record<string, string>) {
    if (stdin.trim().length > 0) {
      this.stdinTokens = stdin.trim().split(/\s+/);
    }
    for (const [k, v] of Object.entries(initialFiles)) {
      this.files.set(k, v);
    }
    // Assign virtual addresses to functions for function pointers
    let fAddr = 0x0400;
    for (const name of ast.functions.keys()) {
      this.funcAddrs.set(String(fAddr), name);
      this.funcNameToAddr.set(name, fAddr);
      fAddr += 16;
    }
  }

  public getSteps(): number {
    return this.steps;
  }

  public getFilesRecord(): Record<string, string> {
    const rec: Record<string, string> = {};
    for (const [k, v] of this.files.entries()) {
      rec[k] = v;
    }
    return rec;
  }

  private tick(line: number) {
    this.steps++;
    if (this.steps > this.MAX_STEPS) {
      throw new RuntimeError(line, 'Execution stopped: step limit exceeded (possible infinite loop)');
    }
  }

  private sizeOf(t: BaseType): number {
    switch (t.kind) {
      case 'void': return 1;
      case 'char': return 1;
      case 'short': return 2;
      case 'int':
      case 'long':
      case 'float':
      case 'pointer':
      case 'file':
      case 'funcptr': return 4;
      case 'double': return 8;
      case 'array': return Math.max(1, t.length) * this.sizeOf(t.of);
      case 'struct':
      case 'union': {
        const def = this.ast.composites.get(`${t.kind}:${t.name}`);
        return def ? def.size : 4;
      }
    }
  }

  private allocStack(size: number): number {
    const addr = this.stackPtr;
    this.stackPtr += Math.max(1, size);
    if (this.stackPtr >= 0x4F00) {
      throw new RuntimeError(0, 'Stack overflow');
    }
    return addr;
  }

  private allocData(size: number): number {
    const addr = this.dataPtr;
    this.dataPtr += Math.max(1, size);
    return addr;
  }

  private internString(s: string): number {
    if (this.stringPool.has(s)) return this.stringPool.get(s)!;
    const addr = this.strPtr;
    for (let i = 0; i < s.length; i++) {
      this.ram[this.strPtr++] = s.charCodeAt(i) & 0xff;
    }
    this.ram[this.strPtr++] = 0; // null terminator
    this.stringPool.set(s, addr);
    return addr;
  }

  private readCString(addr: number, maxLen = 2048): string {
    if (addr <= 0 || addr >= this.ram.length) return '';
    let s = '';
    for (let i = 0; i < maxLen && addr + i < this.ram.length; i++) {
      const byte = this.ram[addr + i];
      if (byte === 0) break;
      s += String.fromCharCode(byte);
    }
    return s;
  }

  private writeCString(addr: number, str: string) {
    if (addr <= 0 || addr >= this.ram.length) return;
    for (let i = 0; i < str.length && addr + i < this.ram.length - 1; i++) {
      this.ram[addr + i] = str.charCodeAt(i) & 0xff;
    }
    this.ram[addr + Math.min(str.length, this.ram.length - addr - 1)] = 0;
  }

  private readMem(addr: number, type: BaseType): number {
    if (addr < 0 || addr >= this.ram.length - 8) {
      throw new RuntimeError(0, `Invalid memory read at 0x${addr.toString(16)}`);
    }
    switch (type.kind) {
      case 'char':
        return type.unsigned ? this.view.getUint8(addr) : this.view.getInt8(addr);
      case 'short':
        return type.unsigned ? this.view.getUint16(addr, true) : this.view.getInt16(addr, true);
      case 'int':
      case 'long':
        return type.unsigned ? this.view.getUint32(addr, true) : this.view.getInt32(addr, true);
      case 'float':
        return this.view.getFloat32(addr, true);
      case 'double':
        return this.view.getFloat64(addr, true);
      case 'pointer':
      case 'file':
      case 'funcptr':
        return this.view.getUint32(addr, true);
      case 'array':
        return addr; // array decays to base address
      default:
        return this.view.getInt32(addr, true);
    }
  }

  private writeMem(addr: number, type: BaseType, val: number) {
    if (addr < 0 || addr >= this.ram.length - 8) {
      throw new RuntimeError(0, `Invalid memory write at 0x${addr.toString(16)}`);
    }
    switch (type.kind) {
      case 'char':
        this.view.setInt8(addr, val);
        break;
      case 'short':
        this.view.setInt16(addr, val, true);
        break;
      case 'int':
      case 'long':
        if (type.unsigned) this.view.setUint32(addr, val >>> 0, true);
        else this.view.setInt32(addr, val | 0, true);
        break;
      case 'float':
        this.view.setFloat32(addr, val, true);
        break;
      case 'double':
        this.view.setFloat64(addr, val, true);
        break;
      case 'pointer':
      case 'file':
      case 'funcptr':
        this.view.setUint32(addr, val >>> 0, true);
        break;
      default:
        this.view.setInt32(addr, val | 0, true);
    }
  }

  public run(): number {
    // Initialize globals
    for (const g of this.ast.globals) {
      const resolvedType = this.resolveVarTypeForInit(g.type, g.init);
      const sz = this.sizeOf(resolvedType);
      const addr = this.allocData(sz);
      this.globals.set(g.name, { addr, type: resolvedType });
      if (g.init) {
        this.initVariable(addr, resolvedType, g.init, [this.globals]);
      }
    }

    const mainFn = this.ast.functions.get('main');
    if (!mainFn) {
      throw new RuntimeError(1, "Undefined reference to 'main': every C program needs a main() function");
    }

    const res = this.callFunction(mainFn, [], mainFn.line);
    // Flush any unclosed files to virtual filesystem
    for (const handle of this.openHandles.values()) {
      if (!handle.closed) {
        this.files.set(handle.filename, handle.content);
      }
    }
    return Math.trunc(res.val);
  }

  private resolveVarTypeForInit(type: BaseType, init?: Expr): BaseType {
    if (type.kind === 'array' && type.length === -1 && init) {
      if (init.kind === 'string') {
        return { kind: 'array', of: type.of, length: init.value.length + 1 };
      }
      if (init.kind === 'initList') {
        return { kind: 'array', of: type.of, length: Math.max(1, init.items.length) };
      }
    }
    return type;
  }

  private initVariable(addr: number, type: BaseType, init: Expr, scopes: Map<string, VarBinding>[]) {
    if (type.kind === 'array') {
      if (init.kind === 'string' && type.of.kind === 'char') {
        this.writeCString(addr, init.value);
        return;
      }
      const elemSize = this.sizeOf(type.of);
      if (init.kind === 'initList') {
        for (let i = 0; i < type.length; i++) {
          const elemAddr = addr + i * elemSize;
          if (i < init.items.length) {
            this.initVariable(elemAddr, type.of, init.items[i], scopes);
          } else {
            this.ram.fill(0, elemAddr, elemAddr + elemSize);
          }
        }
        return;
      }
    }
    if ((type.kind === 'struct' || type.kind === 'union') && init.kind === 'initList') {
      const def = this.ast.composites.get(`${type.kind}:${type.name}`);
      if (def) {
        for (let i = 0; i < def.fields.length && i < init.items.length; i++) {
          const f = def.fields[i];
          this.initVariable(addr + f.offset, f.type, init.items[i], scopes);
        }
        return;
      }
    }
    if ((type.kind === 'struct' || type.kind === 'union') && init.kind !== 'initList') {
      const val = this.evalExpr(init, scopes);
      const sz = this.sizeOf(type);
      if (val.lvalueAddr) {
        this.ram.copyWithin(addr, val.lvalueAddr, val.lvalueAddr + sz);
      } else if (val.val) {
        this.ram.copyWithin(addr, val.val, val.val + sz);
      }
      return;
    }

    const v = this.evalExpr(init, scopes);
    this.writeMem(addr, type, v.val);
  }

  private callFunction(fn: FuncDef, argVals: RuntimeValue[], callLine: number): RuntimeValue {
    const savedStack = this.stackPtr;
    const localScope = new Map<string, VarBinding>();
    const scopes = [localScope, this.globals];

    for (let i = 0; i < fn.params.length; i++) {
      const p = fn.params[i];
      const sz = this.sizeOf(p.type);
      const addr = this.allocStack(sz);
      localScope.set(p.name, { addr, type: p.type });
      const val = argVals[i] ? argVals[i].val : 0;
      if ((p.type.kind === 'struct' || p.type.kind === 'union') && argVals[i]?.lvalueAddr) {
        this.ram.copyWithin(addr, argVals[i].lvalueAddr!, argVals[i].lvalueAddr! + sz);
      } else {
        this.writeMem(addr, p.type, val);
      }
    }

    try {
      this.execStmt(fn.body, scopes, fn.name);
    } catch (sig) {
      if (sig instanceof ControlSignal && sig.kind === 'return') {
        this.stackPtr = savedStack;
        return sig.value ?? { val: 0, type: fn.returnType };
      }
      this.stackPtr = savedStack;
      throw sig;
    }

    this.stackPtr = savedStack;
    if (fn.returnType.kind === 'void') {
      return { val: 0, type: fn.returnType };
    }
    return { val: 0, type: fn.returnType };
  }

  private lookupVar(name: string, scopes: Map<string, VarBinding>[]): VarBinding | undefined {
    for (let i = 0; i < scopes.length; i++) {
      if (scopes[i].has(name)) return scopes[i].get(name);
    }
    return undefined;
  }

  private execStmt(stmt: Stmt, scopes: Map<string, VarBinding>[], fnName: string) {
    this.tick(stmt.line);

    switch (stmt.kind) {
      case 'empty':
        return;

      case 'block': {
        const blockScope = new Map<string, VarBinding>();
        const innerScopes = [blockScope, ...scopes];
        // Support simple goto within the same block
        for (let idx = 0; idx < stmt.stmts.length; idx++) {
          try {
            this.execStmt(stmt.stmts[idx], innerScopes, fnName);
          } catch (sig) {
            if (sig instanceof ControlSignal && sig.kind === 'goto' && sig.label) {
              const targetIdx = stmt.stmts.findIndex((s) => s.kind === 'label' && s.label === sig.label);
              if (targetIdx !== -1) {
                idx = targetIdx - 1;
                continue;
              }
            }
            throw sig;
          }
        }
        return;
      }

      case 'label':
        this.execStmt(stmt.stmt, scopes, fnName);
        return;

      case 'goto':
        throw new ControlSignal('goto', undefined, stmt.label);

      case 'varDecl': {
        const currentScope = scopes[0];
        for (const item of stmt.items) {
          const resolvedType = this.resolveVarTypeForInit(item.type, item.init);
          if (item.isStatic) {
            const staticKey = `${fnName}::${item.name}::${item.line}`;
            if (!this.staticLocals.has(staticKey)) {
              const sz = this.sizeOf(resolvedType);
              const addr = this.allocData(sz);
              this.staticLocals.set(staticKey, { addr, type: resolvedType });
              if (item.init) {
                this.initVariable(addr, resolvedType, item.init, scopes);
              }
            }
            currentScope.set(item.name, this.staticLocals.get(staticKey)!);
          } else {
            const sz = this.sizeOf(resolvedType);
            const addr = this.allocStack(sz);
            currentScope.set(item.name, { addr, type: resolvedType });
            if (item.init) {
              this.initVariable(addr, resolvedType, item.init, scopes);
            } else {
              this.ram.fill(0, addr, addr + sz);
            }
          }
        }
        return;
      }

      case 'expr':
        this.evalExpr(stmt.expr, scopes);
        return;

      case 'if': {
        const c = this.evalExpr(stmt.cond, scopes);
        if (c.val !== 0) {
          this.execStmt(stmt.thenStmt, scopes, fnName);
        } else if (stmt.elseStmt) {
          this.execStmt(stmt.elseStmt, scopes, fnName);
        }
        return;
      }

      case 'switch': {
        const swVal = Math.trunc(this.evalExpr(stmt.expr, scopes).val);
        let matched = false;
        let defaultIdx = -1;
        for (let i = 0; i < stmt.cases.length; i++) {
          const c = stmt.cases[i];
          if (c.isDefault) {
            defaultIdx = i;
          } else if (c.value) {
            const cv = Math.trunc(this.evalExpr(c.value, scopes).val);
            if (cv === swVal) {
              matched = true;
              try {
                for (let j = i; j < stmt.cases.length; j++) {
                  for (const s of stmt.cases[j].stmts) {
                    this.execStmt(s, scopes, fnName);
                  }
                }
              } catch (sig) {
                if (sig instanceof ControlSignal && sig.kind === 'break') return;
                throw sig;
              }
              break;
            }
          }
        }
        if (!matched && defaultIdx !== -1) {
          try {
            for (let j = defaultIdx; j < stmt.cases.length; j++) {
              for (const s of stmt.cases[j].stmts) {
                this.execStmt(s, scopes, fnName);
              }
            }
          } catch (sig) {
            if (sig instanceof ControlSignal && sig.kind === 'break') return;
            throw sig;
          }
        }
        return;
      }

      case 'while': {
        while (this.evalExpr(stmt.cond, scopes).val !== 0) {
          this.tick(stmt.line);
          try {
            this.execStmt(stmt.body, scopes, fnName);
          } catch (sig) {
            if (sig instanceof ControlSignal) {
              if (sig.kind === 'break') break;
              if (sig.kind === 'continue') continue;
            }
            throw sig;
          }
        }
        return;
      }

      case 'doWhile': {
        do {
          this.tick(stmt.line);
          try {
            this.execStmt(stmt.body, scopes, fnName);
          } catch (sig) {
            if (sig instanceof ControlSignal) {
              if (sig.kind === 'break') break;
              if (sig.kind === 'continue') continue;
            }
            throw sig;
          }
        } while (this.evalExpr(stmt.cond, scopes).val !== 0);
        return;
      }

      case 'for': {
        const forScope = new Map<string, VarBinding>();
        const innerScopes = [forScope, ...scopes];
        if (stmt.init) {
          this.execStmt(stmt.init, innerScopes, fnName);
        }
        while (!stmt.cond || this.evalExpr(stmt.cond, innerScopes).val !== 0) {
          this.tick(stmt.line);
          try {
            this.execStmt(stmt.body, innerScopes, fnName);
          } catch (sig) {
            if (sig instanceof ControlSignal) {
              if (sig.kind === 'break') break;
              if (sig.kind === 'continue') {
                if (stmt.update) this.evalExpr(stmt.update, innerScopes);
                continue;
              }
            }
            throw sig;
          }
          if (stmt.update) {
            this.evalExpr(stmt.update, innerScopes);
          }
        }
        return;
      }

      case 'break':
        throw new ControlSignal('break');

      case 'continue':
        throw new ControlSignal('continue');

      case 'return': {
        const val = stmt.expr ? this.evalExpr(stmt.expr, scopes) : undefined;
        throw new ControlSignal('return', val);
      }
    }
  }

  private evalExpr(expr: Expr, scopes: Map<string, VarBinding>[]): RuntimeValue {
    this.tick(expr.line);

    switch (expr.kind) {
      case 'number':
        return { val: expr.value, type: { kind: expr.isFloat ? 'double' : 'int' } };

      case 'char':
        return { val: expr.value, type: { kind: 'char' } };

      case 'null':
        return { val: 0, type: { kind: 'pointer', to: { kind: 'void' } } };

      case 'string': {
        const addr = this.internString(expr.value);
        return { val: addr, type: { kind: 'pointer', to: { kind: 'char' } } };
      }

      case 'ident': {
        const binding = this.lookupVar(expr.name, scopes);
        if (binding) {
          if (binding.type.kind === 'array') {
            return {
              val: binding.addr,
              type: { kind: 'pointer', to: binding.type.of },
              lvalueAddr: binding.addr,
            };
          }
          if (binding.type.kind === 'struct' || binding.type.kind === 'union') {
            return {
              val: binding.addr,
              type: binding.type,
              lvalueAddr: binding.addr,
            };
          }
          return {
            val: this.readMem(binding.addr, binding.type),
            type: binding.type,
            lvalueAddr: binding.addr,
          };
        }
        if (this.funcNameToAddr.has(expr.name)) {
          return {
            val: this.funcNameToAddr.get(expr.name)!,
            type: { kind: 'funcptr', returnType: { kind: 'int' }, params: [] },
          };
        }
        throw new RuntimeError(expr.line, `Undeclared identifier '${expr.name}'`);
      }

      case 'sizeofType':
        return { val: this.sizeOf(expr.targetType), type: { kind: 'int' } };

      case 'sizeofExpr': {
        if (expr.expr.kind === 'ident') {
          const b = this.lookupVar(expr.expr.name, scopes);
          if (b) return { val: this.sizeOf(b.type), type: { kind: 'int' } };
        }
        const v = this.evalExpr(expr.expr, scopes);
        return { val: this.sizeOf(v.type), type: { kind: 'int' } };
      }

      case 'cast': {
        const v = this.evalExpr(expr.expr, scopes);
        let num = v.val;
        if (expr.targetType.kind === 'int' || expr.targetType.kind === 'long' || expr.targetType.kind === 'short' || expr.targetType.kind === 'char') {
          num = Math.trunc(num);
        }
        return { val: num, type: expr.targetType };
      }

      case 'unary': {
        if (expr.op === '&') {
          const target = this.evalExpr(expr.expr, scopes);
          if (target.lvalueAddr === undefined) {
            throw new RuntimeError(expr.line, 'Cannot take address & of a non-lvalue');
          }
          return {
            val: target.lvalueAddr,
            type: { kind: 'pointer', to: target.type },
          };
        }
        if (expr.op === '*') {
          const ptr = this.evalExpr(expr.expr, scopes);
          if (ptr.val === 0) {
            throw new RuntimeError(expr.line, 'Null pointer dereference');
          }
          const pointeeType: BaseType =
            ptr.type.kind === 'pointer' ? ptr.type.to : { kind: 'int' };
          if (pointeeType.kind === 'array') {
            return {
              val: ptr.val,
              type: { kind: 'pointer', to: pointeeType.of },
              lvalueAddr: ptr.val,
            };
          }
          if (pointeeType.kind === 'struct' || pointeeType.kind === 'union') {
            return { val: ptr.val, type: pointeeType, lvalueAddr: ptr.val };
          }
          return {
            val: this.readMem(ptr.val, pointeeType),
            type: pointeeType,
            lvalueAddr: ptr.val,
          };
        }
        if (expr.op === '++' || expr.op === '--') {
          const target = this.evalExpr(expr.expr, scopes);
          if (target.lvalueAddr === undefined) {
            throw new RuntimeError(expr.line, `Operand of ${expr.op} must be an lvalue`);
          }
          const step =
            target.type.kind === 'pointer' ? this.sizeOf(target.type.to) : 1;
          const delta = expr.op === '++' ? step : -step;
          const nextVal = target.val + delta;
          this.writeMem(target.lvalueAddr, target.type, nextVal);
          return {
            val: expr.prefix ? nextVal : target.val,
            type: target.type,
          };
        }
        const v = this.evalExpr(expr.expr, scopes);
        switch (expr.op) {
          case '+': return { val: +v.val, type: v.type };
          case '-': return { val: -v.val, type: v.type };
          case '!': return { val: v.val === 0 ? 1 : 0, type: { kind: 'int' } };
          case '~': return { val: ~Math.trunc(v.val), type: { kind: 'int' } };
        }
        return v;
      }

      case 'index': {
        const arr = this.evalExpr(expr.target, scopes);
        const idx = Math.trunc(this.evalExpr(expr.index, scopes).val);
        let elemType: BaseType = { kind: 'int' };
        if (arr.type.kind === 'pointer') elemType = arr.type.to;
        else if (arr.type.kind === 'array') elemType = arr.type.of;
        const addr = arr.val + idx * this.sizeOf(elemType);
        if (elemType.kind === 'array') {
          return { val: addr, type: { kind: 'pointer', to: elemType.of }, lvalueAddr: addr };
        }
        if (elemType.kind === 'struct' || elemType.kind === 'union') {
          return { val: addr, type: elemType, lvalueAddr: addr };
        }
        return {
          val: this.readMem(addr, elemType),
          type: elemType,
          lvalueAddr: addr,
        };
      }

      case 'member': {
        const target = this.evalExpr(expr.target, scopes);
        let baseAddr = target.lvalueAddr ?? target.val;
        let compType = target.type;
        if (expr.arrow) {
          baseAddr = target.val;
          if (compType.kind === 'pointer') compType = compType.to;
        }
        if (compType.kind !== 'struct' && compType.kind !== 'union') {
          throw new RuntimeError(expr.line, `Member access '.${expr.field}' on non-struct/union type`);
        }
        const def = this.ast.composites.get(`${compType.kind}:${compType.name}`);
        if (!def) throw new RuntimeError(expr.line, `Unknown ${compType.kind} '${compType.name}'`);
        const field = def.fields.find((f) => f.name === expr.field);
        if (!field) throw new RuntimeError(expr.line, `'${compType.name}' has no member named '${expr.field}'`);
        const addr = baseAddr + field.offset;
        if (field.type.kind === 'array') {
          return { val: addr, type: { kind: 'pointer', to: field.type.of }, lvalueAddr: addr };
        }
        if (field.type.kind === 'struct' || field.type.kind === 'union') {
          return { val: addr, type: field.type, lvalueAddr: addr };
        }
        return {
          val: this.readMem(addr, field.type),
          type: field.type,
          lvalueAddr: addr,
        };
      }

      case 'ternary': {
        const c = this.evalExpr(expr.cond, scopes);
        return c.val !== 0 ? this.evalExpr(expr.thenExpr, scopes) : this.evalExpr(expr.elseExpr, scopes);
      }

      case 'binary': {
        if (expr.op === ',') {
          this.evalExpr(expr.left, scopes);
          return this.evalExpr(expr.right, scopes);
        }
        if (expr.op === '&&') {
          const l = this.evalExpr(expr.left, scopes);
          if (l.val === 0) return { val: 0, type: { kind: 'int' } };
          const r = this.evalExpr(expr.right, scopes);
          return { val: r.val !== 0 ? 1 : 0, type: { kind: 'int' } };
        }
        if (expr.op === '||') {
          const l = this.evalExpr(expr.left, scopes);
          if (l.val !== 0) return { val: 1, type: { kind: 'int' } };
          const r = this.evalExpr(expr.right, scopes);
          return { val: r.val !== 0 ? 1 : 0, type: { kind: 'int' } };
        }

        // Assignment operators
        if (['=', '+=', '-=', '*=', '/=', '%='].includes(expr.op)) {
          const lhs = this.evalExpr(expr.left, scopes);
          if (lhs.lvalueAddr === undefined) {
            throw new RuntimeError(expr.line, 'Left-hand side of assignment must be assignable');
          }
          const rhs = this.evalExpr(expr.right, scopes);
          let newVal = rhs.val;
          if (expr.op === '+=') {
            const step = lhs.type.kind === 'pointer' ? this.sizeOf(lhs.type.to) : 1;
            newVal = lhs.val + rhs.val * step;
          } else if (expr.op === '-=') {
            const step = lhs.type.kind === 'pointer' ? this.sizeOf(lhs.type.to) : 1;
            newVal = lhs.val - rhs.val * step;
          } else if (expr.op === '*=') newVal = lhs.val * rhs.val;
          else if (expr.op === '/=') {
            if (rhs.val === 0) throw new RuntimeError(expr.line, 'Division by zero');
            newVal = this.isFloatType(lhs.type) ? lhs.val / rhs.val : Math.trunc(lhs.val / rhs.val);
          } else if (expr.op === '%=') {
            if (rhs.val === 0) throw new RuntimeError(expr.line, 'Modulo by zero');
            newVal = Math.trunc(lhs.val) % Math.trunc(rhs.val);
          }
          this.writeMem(lhs.lvalueAddr, lhs.type, newVal);
          return { val: this.readMem(lhs.lvalueAddr, lhs.type), type: lhs.type };
        }

        const left = this.evalExpr(expr.left, scopes);
        const right = this.evalExpr(expr.right, scopes);

        // Pointer arithmetic
        if (expr.op === '+' && left.type.kind === 'pointer') {
          const stride = this.sizeOf(left.type.to);
          return { val: left.val + Math.trunc(right.val) * stride, type: left.type };
        }
        if (expr.op === '+' && right.type.kind === 'pointer') {
          const stride = this.sizeOf(right.type.to);
          return { val: right.val + Math.trunc(left.val) * stride, type: right.type };
        }
        if (expr.op === '-' && left.type.kind === 'pointer') {
          const stride = this.sizeOf(left.type.to);
          if (right.type.kind === 'pointer') {
            return { val: Math.trunc((left.val - right.val) / stride), type: { kind: 'int' } };
          }
          return { val: left.val - Math.trunc(right.val) * stride, type: left.type };
        }

        const isFloat = this.isFloatType(left.type) || this.isFloatType(right.type);
        const resType: BaseType = isFloat ? { kind: 'double' } : { kind: 'int' };

        switch (expr.op) {
          case '+': return { val: left.val + right.val, type: resType };
          case '-': return { val: left.val - right.val, type: resType };
          case '*': return { val: left.val * right.val, type: resType };
          case '/':
            if (right.val === 0) throw new RuntimeError(expr.line, 'Division by zero');
            return { val: isFloat ? left.val / right.val : Math.trunc(left.val / right.val), type: resType };
          case '%':
            if (right.val === 0) throw new RuntimeError(expr.line, 'Modulo by zero');
            return { val: Math.trunc(left.val) % Math.trunc(right.val), type: { kind: 'int' } };
          case '==': return { val: left.val === right.val ? 1 : 0, type: { kind: 'int' } };
          case '!=': return { val: left.val !== right.val ? 1 : 0, type: { kind: 'int' } };
          case '<': return { val: left.val < right.val ? 1 : 0, type: { kind: 'int' } };
          case '<=': return { val: left.val <= right.val ? 1 : 0, type: { kind: 'int' } };
          case '>': return { val: left.val > right.val ? 1 : 0, type: { kind: 'int' } };
          case '>=': return { val: left.val >= right.val ? 1 : 0, type: { kind: 'int' } };
          case '&': return { val: Math.trunc(left.val) & Math.trunc(right.val), type: { kind: 'int' } };
          case '|': return { val: Math.trunc(left.val) | Math.trunc(right.val), type: { kind: 'int' } };
          case '^': return { val: Math.trunc(left.val) ^ Math.trunc(right.val), type: { kind: 'int' } };
          case '<<': return { val: Math.trunc(left.val) << Math.trunc(right.val), type: { kind: 'int' } };
          case '>>': return { val: Math.trunc(left.val) >> Math.trunc(right.val), type: { kind: 'int' } };
        }
        return { val: 0, type: { kind: 'int' } };
      }

      case 'call': {
        // Resolve callee name (direct function or function pointer)
        let fnName = '';
        if (expr.callee.kind === 'ident' && !this.lookupVar(expr.callee.name, scopes)) {
          fnName = expr.callee.name;
        } else {
          const fnPtrVal = this.evalExpr(expr.callee, scopes);
          const resolved = this.funcAddrs.get(String(fnPtrVal.val));
          if (!resolved) {
            throw new RuntimeError(expr.line, 'Invalid function pointer call');
          }
          fnName = resolved;
        }

        const argVals = expr.args.map((a) => this.evalExpr(a, scopes));

        // Check standard library builtins first
        const builtin = this.tryCallBuiltin(fnName, argVals, expr.args, scopes, expr.line);
        if (builtin !== null) return builtin;

        const userFn = this.ast.functions.get(fnName);
        if (!userFn) {
          throw new RuntimeError(expr.line, `Undefined function '${fnName}'`);
        }
        return this.callFunction(userFn, argVals, expr.line);
      }

      case 'initList':
        return { val: 0, type: { kind: 'int' } };
    }
  }

  private isFloatType(t: BaseType): boolean {
    return t.kind === 'float' || t.kind === 'double';
  }

  private formatPrintf(fmt: string, args: RuntimeValue[], startIdx: number): string {
    let out = '';
    let argIdx = startIdx;
    let i = 0;
    while (i < fmt.length) {
      if (fmt[i] !== '%') {
        out += fmt[i++];
        continue;
      }
      i++;
      if (fmt[i] === '%') {
        out += '%';
        i++;
        continue;
      }

      let zeroPad = false;
      if (fmt[i] === '0') {
        zeroPad = true;
        i++;
      } else if (fmt[i] === '-') {
        i++;
      }
      let widthStr = '';
      while (i < fmt.length && /[0-9]/.test(fmt[i])) widthStr += fmt[i++];
      let precStr = '';
      if (fmt[i] === '.') {
        i++;
        while (i < fmt.length && /[0-9]/.test(fmt[i])) precStr += fmt[i++];
      }
      if (fmt[i] === 'l' || fmt[i] === 'h') {
        i++;
        if (fmt[i] === 'l') i++;
      }
      const spec = fmt[i++] || '';
      const arg = args[argIdx++] ?? { val: 0, type: { kind: 'int' } };
      let formatted = '';

      switch (spec) {
        case 'd':
        case 'i':
          formatted = String(Math.trunc(arg.val));
          break;
        case 'u':
          formatted = String(Math.trunc(arg.val) >>> 0);
          break;
        case 'f': {
          const prec = precStr ? parseInt(precStr, 10) : 6;
          formatted = Number(arg.val).toFixed(prec);
          break;
        }
        case 'c':
          formatted = String.fromCharCode(Math.trunc(arg.val) & 0xff);
          break;
        case 's':
          formatted = this.readCString(arg.val);
          break;
        case 'x':
          formatted = (Math.trunc(arg.val) >>> 0).toString(16);
          break;
        case 'X':
          formatted = (Math.trunc(arg.val) >>> 0).toString(16).toUpperCase();
          break;
        case 'o':
          formatted = (Math.trunc(arg.val) >>> 0).toString(8);
          break;
        case 'p':
          formatted = '0x' + (arg.val >>> 0).toString(16).padStart(6, '0');
          break;
        default:
          formatted = '%' + spec;
      }

      const width = widthStr ? parseInt(widthStr, 10) : 0;
      if (width > formatted.length) {
        formatted = formatted.padStart(width, zeroPad ? '0' : ' ');
      }
      out += formatted;
    }
    return out;
  }

  private tryCallBuiltin(
    name: string,
    args: RuntimeValue[],
    rawArgs: Expr[],
    scopes: Map<string, VarBinding>[],
    line: number
  ): RuntimeValue | null {
    switch (name) {
      case 'printf': {
        const fmt = args[0] ? this.readCString(args[0].val) : '';
        const text = this.formatPrintf(fmt, args, 1);
        this.output += text;
        return { val: text.length, type: { kind: 'int' } };
      }

      case 'puts': {
        const s = args[0] ? this.readCString(args[0].val) : '';
        this.output += s + '\n';
        return { val: s.length + 1, type: { kind: 'int' } };
      }

      case 'putchar': {
        const ch = String.fromCharCode((args[0]?.val ?? 0) & 0xff);
        this.output += ch;
        return { val: args[0]?.val ?? 0, type: { kind: 'int' } };
      }

      case 'scanf': {
        const fmt = args[0] ? this.readCString(args[0].val) : '';
        const specs = fmt.match(/%[diufcs]/g) || [];
        let assigned = 0;
        for (let k = 0; k < specs.length; k++) {
          const ptr = args[k + 1]?.val;
          if (!ptr) break;
          const rawTok = this.stdinTokens[this.stdinIndex++];
          if (rawTok === undefined) break;
          const sp = specs[k];
          if (sp === '%s') {
            this.writeCString(ptr, rawTok);
          } else if (sp === '%c') {
            this.writeMem(ptr, { kind: 'char' }, rawTok.charCodeAt(0) || 0);
          } else if (sp === '%f') {
            // Check rawArg type to match float vs double
            const targetExpr = rawArgs[k + 1];
            let targetType: BaseType = { kind: 'float' };
            if (targetExpr?.kind === 'unary' && targetExpr.op === '&') {
              const inner = this.evalExpr(targetExpr.expr, scopes);
              targetType = inner.type;
            }
            this.writeMem(ptr, targetType, parseFloat(rawTok) || 0);
          } else {
            this.writeMem(ptr, { kind: 'int' }, parseInt(rawTok, 10) || 0);
          }
          assigned++;
        }
        return { val: assigned, type: { kind: 'int' } };
      }

      // String library
      case 'strlen': {
        const s = this.readCString(args[0]?.val ?? 0);
        return { val: s.length, type: { kind: 'int' } };
      }
      case 'strcpy': {
        const dest = args[0]?.val ?? 0;
        const src = this.readCString(args[1]?.val ?? 0);
        this.writeCString(dest, src);
        return { val: dest, type: { kind: 'pointer', to: { kind: 'char' } } };
      }
      case 'strncpy': {
        const dest = args[0]?.val ?? 0;
        const src = this.readCString(args[1]?.val ?? 0);
        const n = Math.max(0, Math.trunc(args[2]?.val ?? 0));
        this.writeCString(dest, src.slice(0, n));
        return { val: dest, type: { kind: 'pointer', to: { kind: 'char' } } };
      }
      case 'strcat': {
        const dest = args[0]?.val ?? 0;
        const existing = this.readCString(dest);
        const src = this.readCString(args[1]?.val ?? 0);
        this.writeCString(dest, existing + src);
        return { val: dest, type: { kind: 'pointer', to: { kind: 'char' } } };
      }
      case 'strcmp': {
        const a = this.readCString(args[0]?.val ?? 0);
        const b = this.readCString(args[1]?.val ?? 0);
        const res = a === b ? 0 : a < b ? -1 : 1;
        return { val: res, type: { kind: 'int' } };
      }

      // Math library
      case 'sqrt': return { val: Math.sqrt(args[0]?.val ?? 0), type: { kind: 'double' } };
      case 'pow': return { val: Math.pow(args[0]?.val ?? 0, args[1]?.val ?? 0), type: { kind: 'double' } };
      case 'abs': return { val: Math.abs(Math.trunc(args[0]?.val ?? 0)), type: { kind: 'int' } };
      case 'fabs': return { val: Math.abs(args[0]?.val ?? 0), type: { kind: 'double' } };
      case 'ceil': return { val: Math.ceil(args[0]?.val ?? 0), type: { kind: 'double' } };
      case 'floor': return { val: Math.floor(args[0]?.val ?? 0), type: { kind: 'double' } };

      // Dynamic Memory Allocation
      case 'malloc': {
        const size = Math.max(1, Math.trunc(args[0]?.val ?? 0));
        const addr = this.heapPtr;
        this.heapPtr += size + 8; // small guard gap
        if (this.heapPtr >= 0xC800) throw new RuntimeError(line, 'Virtual heap memory exhausted');
        // Fill with 0xCD to illustrate uninitialized memory vs calloc
        this.ram.fill(0xcd, addr, addr + size);
        this.heapBlocks.push({ address: addr, size, freed: false, allocator: 'malloc', line });
        return { val: addr, type: { kind: 'pointer', to: { kind: 'void' } } };
      }
      case 'calloc': {
        const count = Math.max(1, Math.trunc(args[0]?.val ?? 1));
        const elemSize = Math.max(1, Math.trunc(args[1]?.val ?? 4));
        const size = count * elemSize;
        const addr = this.heapPtr;
        this.heapPtr += size + 8;
        if (this.heapPtr >= 0xC800) throw new RuntimeError(line, 'Virtual heap memory exhausted');
        this.ram.fill(0, addr, addr + size); // calloc zero-initializes
        this.heapBlocks.push({ address: addr, size, freed: false, allocator: 'calloc', line });
        return { val: addr, type: { kind: 'pointer', to: { kind: 'void' } } };
      }
      case 'realloc': {
        const oldAddr = args[0]?.val ?? 0;
        const newSize = Math.max(1, Math.trunc(args[1]?.val ?? 0));
        const newAddr = this.heapPtr;
        this.heapPtr += newSize + 8;
        if (this.heapPtr >= 0xC800) throw new RuntimeError(line, 'Virtual heap memory exhausted');
        const oldBlock = this.heapBlocks.find((b) => b.address === oldAddr && !b.freed);
        if (oldBlock) {
          const copyLen = Math.min(oldBlock.size, newSize);
          this.ram.copyWithin(newAddr, oldAddr, oldAddr + copyLen);
          oldBlock.freed = true;
        }
        this.heapBlocks.push({ address: newAddr, size: newSize, freed: false, allocator: 'realloc', line });
        return { val: newAddr, type: { kind: 'pointer', to: { kind: 'void' } } };
      }
      case 'free': {
        const addr = args[0]?.val ?? 0;
        if (addr !== 0) {
          const block = this.heapBlocks.find((b) => b.address === addr);
          if (block) {
            if (block.freed) {
              throw new RuntimeError(line, `Double free detected at 0x${addr.toString(16)}`);
            }
            block.freed = true;
          }
        }
        return { val: 0, type: { kind: 'void' } };
      }

      // File Handling
      case 'fopen': {
        const filename = this.readCString(args[0]?.val ?? 0);
        const mode = this.readCString(args[1]?.val ?? 0) || 'r';
        if (mode.startsWith('r') && !this.files.has(filename)) {
          return { val: 0, type: { kind: 'pointer', to: { kind: 'file' } } }; // NULL
        }
        let content = '';
        if (mode.startsWith('w')) {
          content = '';
          this.files.set(filename, '');
        } else if (mode.startsWith('a')) {
          content = this.files.get(filename) ?? '';
        } else {
          content = this.files.get(filename) ?? '';
        }
        const handleAddr = this.nextHandleAddr++;
        this.openHandles.set(handleAddr, {
          filename,
          mode,
          cursor: mode.startsWith('a') ? content.length : 0,
          content,
          closed: false,
        });
        return { val: handleAddr, type: { kind: 'pointer', to: { kind: 'file' } } };
      }
      case 'fclose': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (handle && !handle.closed) {
          handle.closed = true;
          this.files.set(handle.filename, handle.content);
          return { val: 0, type: { kind: 'int' } };
        }
        return { val: -1, type: { kind: 'int' } };
      }
      case 'fprintf': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (!handle || handle.closed) return { val: -1, type: { kind: 'int' } };
        const fmt = args[1] ? this.readCString(args[1].val) : '';
        const text = this.formatPrintf(fmt, args, 2);
        handle.content += text;
        handle.cursor = handle.content.length;
        this.files.set(handle.filename, handle.content);
        return { val: text.length, type: { kind: 'int' } };
      }
      case 'fputs': {
        const str = this.readCString(args[0]?.val ?? 0);
        const handle = this.openHandles.get(args[1]?.val ?? 0);
        if (!handle || handle.closed) return { val: -1, type: { kind: 'int' } };
        handle.content += str;
        handle.cursor = handle.content.length;
        this.files.set(handle.filename, handle.content);
        return { val: str.length, type: { kind: 'int' } };
      }
      case 'fputc': {
        const ch = String.fromCharCode((args[0]?.val ?? 0) & 0xff);
        const handle = this.openHandles.get(args[1]?.val ?? 0);
        if (!handle || handle.closed) return { val: -1, type: { kind: 'int' } };
        handle.content += ch;
        this.files.set(handle.filename, handle.content);
        return { val: args[0]?.val ?? 0, type: { kind: 'int' } };
      }
      case 'fgets': {
        const bufAddr = args[0]?.val ?? 0;
        const maxN = Math.max(1, Math.trunc(args[1]?.val ?? 128));
        const handle = this.openHandles.get(args[2]?.val ?? 0);
        if (!handle || handle.closed || handle.cursor >= handle.content.length) {
          return { val: 0, type: { kind: 'pointer', to: { kind: 'char' } } }; // NULL
        }
        const remaining = handle.content.slice(handle.cursor);
        const nlIdx = remaining.indexOf('\n');
        const sliceLen = nlIdx !== -1 ? Math.min(nlIdx + 1, maxN - 1) : Math.min(remaining.length, maxN - 1);
        const lineStr = remaining.slice(0, sliceLen);
        handle.cursor += sliceLen;
        this.writeCString(bufAddr, lineStr);
        return { val: bufAddr, type: { kind: 'pointer', to: { kind: 'char' } } };
      }
      case 'fgetc': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (!handle || handle.closed || handle.cursor >= handle.content.length) {
          return { val: -1, type: { kind: 'int' } }; // EOF
        }
        const ch = handle.content.charCodeAt(handle.cursor++);
        return { val: ch, type: { kind: 'int' } };
      }
      case 'fscanf': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (!handle || handle.closed) return { val: -1, type: { kind: 'int' } };
        const fmt = args[1] ? this.readCString(args[1].val) : '';
        const specs = fmt.match(/%[diufcs]/g) || [];
        let assigned = 0;
        for (let k = 0; k < specs.length; k++) {
          const rest = handle.content.slice(handle.cursor).trimStart();
          if (!rest) break;
          const wsOffset = handle.content.length - handle.cursor - rest.length;
          const match = rest.match(/^\S+/);
          if (!match) break;
          const tok = match[0];
          handle.cursor += wsOffset + tok.length;
          const ptr = args[k + 2]?.val;
          if (!ptr) break;
          if (specs[k] === '%s') this.writeCString(ptr, tok);
          else if (specs[k] === '%f') this.writeMem(ptr, { kind: 'float' }, parseFloat(tok) || 0);
          else this.writeMem(ptr, { kind: 'int' }, parseInt(tok, 10) || 0);
          assigned++;
        }
        return { val: assigned === 0 ? -1 : assigned, type: { kind: 'int' } };
      }
      case 'rewind': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (handle) handle.cursor = 0;
        return { val: 0, type: { kind: 'void' } };
      }
      case 'feof': {
        const handle = this.openHandles.get(args[0]?.val ?? 0);
        if (!handle) return { val: 1, type: { kind: 'int' } };
        return { val: handle.cursor >= handle.content.length ? 1 : 0, type: { kind: 'int' } };
      }
      case 'exit': {
        throw new ControlSignal('return', { val: args[0]?.val ?? 0, type: { kind: 'int' } });
      }
    }

    return null;
  }
}

// ---------------- Public API ----------------

export function checkCSyntax(source: string): SyntaxCheckResult {
  const prep = preprocess(source);
  const diagnostics = [...prep.diagnostics];
  const tokens = tokenize(prep.code, prep.macros, diagnostics);
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  diagnostics.push(...parser.diagnostics);

  if (!ast.functions.has('main') && source.trim().length > 0 && diagnostics.length === 0) {
    diagnostics.push({
      line: 1,
      column: 1,
      severity: 'warning',
      message: 'No main() function found yet. Execution starts at int main().',
    });
  }

  return {
    valid: diagnostics.filter((d) => d.severity === 'error').length === 0,
    diagnostics,
    headers: prep.headers,
    macros: Array.from(prep.macros.keys()),
    functions: Array.from(ast.functions.keys()),
  };
}

export function runCProgram(
  source: string,
  stdin = '',
  initialFiles: Record<string, string> = {}
): ExecutionResult {
  const start = performance.now();
  const prep = preprocess(source);
  const diagnostics = [...prep.diagnostics];
  const tokens = tokenize(prep.code, prep.macros, diagnostics);
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  diagnostics.push(...parser.diagnostics);

  if (diagnostics.some((d) => d.severity === 'error')) {
    return {
      success: false,
      output: '',
      diagnostics,
      heapBlocks: [],
      files: initialFiles,
      stepsExecuted: 0,
      executionMs: Math.round((performance.now() - start) * 10) / 10,
      exitCode: 1,
    };
  }

  const vm = new VirtualMachine(ast, stdin, initialFiles);
  try {
    const exitCode = vm.run();
    const unfreed = vm.heapBlocks.filter((b) => !b.freed);
    if (unfreed.length > 0) {
      for (const b of unfreed) {
        diagnostics.push({
          line: b.line,
          column: 1,
          severity: 'warning',
          message: `Memory leak hint: ${b.size} bytes allocated at 0x${b.address.toString(16)} via ${b.allocator}() were never freed with free().`,
        });
      }
    }
    return {
      success: true,
      output: vm.output,
      diagnostics,
      heapBlocks: vm.heapBlocks,
      files: vm.getFilesRecord(),
      stepsExecuted: vm.getSteps(),
      executionMs: Math.round((performance.now() - start) * 10) / 10,
      exitCode,
    };
  } catch (err) {
    const line = err instanceof RuntimeError ? Math.max(1, err.line) : 1;
    const message = err instanceof Error ? err.message : 'Runtime error';
    diagnostics.push({ line, column: 1, severity: 'error', message });
    return {
      success: false,
      output: vm.output,
      diagnostics,
      heapBlocks: vm.heapBlocks,
      files: vm.getFilesRecord(),
      stepsExecuted: vm.getSteps(),
      executionMs: Math.round((performance.now() - start) * 10) / 10,
      exitCode: 1,
    };
  }
}
