export interface ConceptSection {
  title: string;
  summary: string;
  keyPoints: string[];
  codeSnippet?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  number: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  syllabusTopics: string[];
  interactiveWidget?: 'memory-layout' | 'bit-converter' | 'compilation-flow';
  sections: ConceptSection[];
  starterCode: string;
  starterStdin?: string;
  challengePrompt: string;
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  hours: number;
  description: string;
  lessons: Lesson[];
}

export const SYLLABUS_MODULES: Module[] = [
  {
    id: 'module-1',
    number: 1,
    title: 'Problem-Solving, Bits & Fundamentals of C',
    hours: 8,
    description:
      'Engineering problem-solving, binary and complement arithmetic, C program anatomy, data types, and operator precedence.',
    lessons: [
      {
        id: 'm1-problem-solving',
        moduleId: 'module-1',
        number: '1.1',
        title: 'Introduction to Problem-Solving',
        subtitle: 'Algorithms, Flowcharts, History of C, Memory Layout & GCC',
        estimatedMinutes: 20,
        syllabusTopics: [
          'Engineering problem-solving methodology',
          'Flowcharts and Algorithms',
          'Need for computer languages & High-level languages',
          'History of C',
          'Memory Layout of a C Program',
          'GCC compiler',
        ],
        interactiveWidget: 'memory-layout',
        sections: [
          {
            title: 'Engineering Problem-Solving, Algorithms & Flowcharts',
            summary:
              'Before writing code, engineers break problems into clear steps: Define Problem → Analyze Inputs/Outputs → Design Algorithm → Draw Flowchart → Implement in C → Test & Debug.',
            keyPoints: [
              'Algorithm: A finite, unambiguous sequence of step-by-step instructions to solve a problem.',
              'Flowchart symbols: Oval (Start/Stop), Parallelogram (Input/Output), Rectangle (Process), Diamond (Decision), Arrows (Control Flow).',
              'Need for languages: CPUs only understand binary machine code; high-level languages like C bridge human logic and hardware speed.',
            ],
          },
          {
            title: 'History of C & Why It Endures',
            summary:
              'Created by Dennis Ritchie at Bell Laboratories in 1972 to rewrite the UNIX operating system, C combines high-level structured syntax with low-level memory control.',
            keyPoints: [
              'Evolved from BCPL and B language; standardized as ANSI C (C89), C99, C11, and C17.',
              'Powers OS kernels (Linux, Windows), embedded microcontrollers, databases, and compilers.',
            ],
          },
          {
            title: 'Memory Layout & GCC Compiler',
            summary:
              'When GCC (GNU Compiler Collection) compiles your .c file (gcc main.c -o app), the running process organizes RAM into five distinct segments.',
            keyPoints: [
              'Text Segment: Stores compiled machine instructions (read-only).',
              'Initialized Data & BSS: Stores global and static variables (BSS holds uninitialized globals set to 0).',
              'Heap: Dynamic memory grown upward via malloc/calloc.',
              'Stack: Stores local variables and function call frames, growing downward.',
            ],
            codeSnippet: `// Memory segment destinations in C
int globalInit = 100;     // Initialized Data segment
int globalUninit;         // BSS segment (auto zero)

int main() {
    int localVar = 42;    // Stack segment
    return 0;
}`,
          },
        ],
        starterCode: `#include <stdio.h>
#include <stdlib.h>

int globalInitialized = 42;
int globalBSS;

int main() {
    int stackVar = 10;
    static int staticVar = 99;
    int *heapPtr = (int *)malloc(sizeof(int));
    *heapPtr = 777;

    printf("C Memory Layout Addresses:\\n");
    printf("  Global (Data) : %p = %d\\n", &globalInitialized, globalInitialized);
    printf("  Global (BSS)  : %p = %d\\n", &globalBSS, globalBSS);
    printf("  Static Local  : %p = %d\\n", &staticVar, staticVar);
    printf("  Local (Stack) : %p = %d\\n", &stackVar, stackVar);
    printf("  Dynamic (Heap): %p = %d\\n", heapPtr, *heapPtr);

    free(heapPtr);
    return 0;
}`,
        challengePrompt:
          'Add a second local variable `int secondVar = 25;` and print its stack address with `%p`. Observe how stack addresses increment sequentially.',
        quiz: [
          {
            id: 'q-1-1-1',
            question: 'Which flowchart symbol is strictly used for branching conditions such as if/else checks?',
            options: ['Rectangle', 'Parallelogram', 'Diamond', 'Oval'],
            correctIndex: 2,
            explanation: 'A Diamond represents a decision/condition with Yes/No (True/False) outgoing paths.',
          },
          {
            id: 'q-1-1-2',
            question: 'Where are uninitialized global and static variables stored in the memory layout of a C program?',
            options: ['Stack segment', 'BSS segment', 'Heap segment', 'Text segment'],
            correctIndex: 1,
            explanation: 'The BSS (Block Started by Symbol) segment stores uninitialized global and static variables, automatically zero-initialized at startup.',
          },
          {
            id: 'q-1-1-3',
            question: 'Who developed the C programming language at Bell Labs in 1972?',
            options: ['Bjarne Stroustrup', 'Ken Thompson', 'Dennis Ritchie', 'James Gosling'],
            correctIndex: 2,
            explanation: 'Dennis Ritchie developed C at Bell Labs in 1972 while building the UNIX operating system.',
          },
          {
            id: 'q-1-1-4',
            question: 'Which command compiles `program.c` with GCC into an executable named `app`?',
            options: ['gcc -r program.c app', 'gcc program.c -o app', 'gcc compile program.c', 'cc -run program.c'],
            correctIndex: 1,
            explanation: 'The `-o` flag specifies the output executable filename (`gcc program.c -o app`).',
          },
        ],
      },
      {
        id: 'm1-language-of-bits',
        moduleId: 'module-1',
        number: '1.2',
        title: 'Language of Bits',
        subtitle: "Binary, 1's & 2's Complement, Arithmetic, Octal & Hexadecimal",
        estimatedMinutes: 25,
        syllabusTopics: [
          'Binary Representation of Data',
          "1's and 2's complement representation",
          'Computer Arithmetic',
          'Octal and HexaDecimal Representation',
        ],
        interactiveWidget: 'bit-converter',
        sections: [
          {
            title: 'Binary, Octal & Hexadecimal Systems',
            summary:
              'Computers store every number, character, and instruction as base-2 bits (0 and 1). Octal (base-8) groups 3 bits per digit, while Hexadecimal (base-16) groups 4 bits (a nibble) per digit.',
            keyPoints: [
              'Binary (0b): Digits 0–1. Example: 1011₂ = 8 + 2 + 1 = 11₁₀.',
              'Octal (0 prefix in C): Digits 0–7. Example: 017₈ = 15₁₀.',
              'Hexadecimal (0x prefix in C): Digits 0–9, A–F. Example: 0x2F₁₆ = 47₁₀.',
            ],
          },
          {
            title: "1's and 2's Complement Representation",
            summary:
              "To represent negative integers and perform subtraction using addition hardware, C uses 2's complement.",
            keyPoints: [
              "1's Complement: Flip every bit (0 ↔ 1). Has two representations for zero (+0 and -0).",
              "2's Complement: Take 1's complement and add 1. Unique zero and range for n bits is [-2^(n-1), 2^(n-1) - 1].",
              "For 8 bits: +5 is 00000101; 1's comp is 11111010; 2's comp (-5) is 11111011.",
            ],
          },
          {
            title: 'Computer Arithmetic',
            summary:
              'Binary addition follows 0+0=0, 0+1=1, 1+1=10 (0 carry 1). Subtraction A - B is computed by adding A + (2s complement of B).',
            keyPoints: [
              'Carry out of the MSB is discarded in fixed-width 2s complement addition.',
              'Overflow occurs when adding two positives yields a negative, or two negatives yield a positive.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

int main() {
    int dec = 45;
    int hexVal = 0x2D;
    int octVal = 055;
    int neg = -5;

    printf("Decimal 45 in different bases:\\n");
    printf("  Decimal     : %d\\n", dec);
    printf("  Octal       : 0%o\\n", dec);
    printf("  Hexadecimal : 0x%X\\n", dec);
    printf("  Equal check : %d == %d == %d\\n\\n", dec, hexVal, octVal);

    printf("Bitwise 1's complement (~5) = %d\\n", ~5);
    printf("2's complement (~5 + 1)     = %d (matches %d)\\n", (~5 + 1), neg);
    return 0;
}`,
        challengePrompt:
          'Change `dec` to `255` and check its Octal (`%o`) and Hexadecimal (`%X`) representation. Then try computing `~12 + 1`.',
        quiz: [
          {
            id: 'q-1-2-1',
            question: "What is the 8-bit 2's complement representation of -6?",
            options: ['10000110', '11111001', '11111010', '11111011'],
            correctIndex: 2,
            explanation: "+6 is 00000110. Flipping bits gives 11111001 (1's complement). Adding 1 gives 11111010.",
          },
          {
            id: 'q-1-2-2',
            question: 'What is the decimal value of the hexadecimal literal `0x1A` in C?',
            options: ['16', '26', '20', '32'],
            correctIndex: 1,
            explanation: '1 × 16¹ + 10 × 16⁰ = 16 + 10 = 26.',
          },
          {
            id: 'q-1-2-3',
            question: 'How many binary bits correspond to a single hexadecimal digit?',
            options: ['2 bits', '3 bits', '4 bits', '8 bits'],
            correctIndex: 2,
            explanation: 'Since 2⁴ = 16, each hexadecimal digit represents exactly 4 bits (one nibble).',
          },
          {
            id: 'q-1-2-4',
            question: "In an 8-bit signed 2's complement system, what is the valid integer range?",
            options: ['-127 to +127', '-128 to +127', '0 to 255', '-256 to +255'],
            correctIndex: 1,
            explanation: 'An n-bit signed 2s complement integer spans from -2^(n-1) (-128) to 2^(n-1)-1 (+127).',
          },
        ],
      },
      {
        id: 'm1-fundamentals',
        moduleId: 'module-1',
        number: '1.3',
        title: 'Fundamentals of C',
        subtitle: 'Program Structure, Preprocessor, Data Types, I/O & Operators',
        estimatedMinutes: 30,
        syllabusTopics: [
          'Program structure & C character set',
          'Preprocessors Directives & Header Files',
          'Compilation Flow of a C program',
          'Library functions & I/O functions in C',
          'Comments, data types, identifiers & keywords',
          'Declarations, Operators and expressions',
          'Type Conversion, Precedence and Associativity',
        ],
        interactiveWidget: 'compilation-flow',
        sections: [
          {
            title: 'Program Structure, Preprocessor & Compilation Flow',
            summary:
              'Every C program flows through 4 build stages: Preprocessing (.i) → Compilation (.s assembly) → Assembly (.o object) → Linking (executable).',
            keyPoints: [
              'Preprocessor Directives start with #: `#include <stdio.h>` inserts header declarations; `#define PI 3.14` defines macros.',
              'C Character Set: Letters (A–Z, a–z), Digits (0–9), Special symbols (+, -, *, ;, {, }), and whitespace.',
              'Comments: `// single-line` and `/* multi-line */` are stripped before compilation.',
            ],
          },
          {
            title: 'Data Types, Identifiers, Keywords & I/O',
            summary:
              'C has 32 reserved keywords (`int`, `return`, `if`, etc.). Identifiers name variables and functions using letters, digits, or `_` (never starting with a digit).',
            keyPoints: [
              'Primary types: `char` (1 byte, %c), `int` (4 bytes, %d), `float` (4 bytes, %f), `double` (8 bytes, %lf), `void`.',
              'Formatted I/O: `printf("Val: %d", x)` prints output; `scanf("%d", &x)` reads input into address `&x`.',
            ],
          },
          {
            title: 'Operators, Type Conversion, Precedence & Associativity',
            summary:
              'Expressions evaluate by operator precedence (e.g., `* / %` before `+ -`) and associativity (left-to-right for arithmetic, right-to-left for `=`).',
            keyPoints: [
              'Implicit conversion promotes smaller types (int → float) automatically during mixed arithmetic.',
              'Explicit casting: `(float)a / b` forces floating-point division instead of integer truncation.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>
#define TAX_RATE 0.18

int main() {
    int items = 3;
    int totalCents = 10;
    float exactAvg;

    // Integer division vs Explicit Type Casting
    int intAvg = totalCents / items;
    exactAvg = (float)totalCents / items;

    // Operator Precedence: * binds tighter than +
    int expr = 5 + 3 * 2;
    float taxed = exactAvg * (1 + TAX_RATE);

    printf("Integer division (10 / 3)  = %d\\n", intAvg);
    printf("Explicit cast (float)10/3  = %.2f\\n", exactAvg);
    printf("Precedence (5 + 3 * 2)     = %d\\n", expr);
    printf("With 18%% TAX_RATE macro    = %.2f\\n", taxed);
    return 0;
}`,
        challengePrompt:
          'Use `scanf("%d", &items);` with custom Stdin Input (e.g., `4`) to test dynamic division and tax calculation.',
        quiz: [
          {
            id: 'q-1-3-1',
            question: 'What is the correct order of the 4 stages in the C compilation flow?',
            options: [
              'Compilation → Preprocessing → Linking → Assembly',
              'Preprocessing → Compilation → Assembly → Linking',
              'Assembly → Preprocessing → Compilation → Linking',
              'Preprocessing → Linking → Compilation → Assembly',
            ],
            correctIndex: 1,
            explanation: 'GCC runs Preprocessor (.i) → Compiler (.s) → Assembler (.o) → Linker (executable).',
          },
          {
            id: 'q-1-3-2',
            question: 'What is printed by `printf("%.1f", (float)(7 / 2));`?',
            options: ['3.5', '3.0', '3', '4.0'],
            correctIndex: 1,
            explanation: '`7 / 2` executes first as integer division yielding `3`, which is then cast to `3.0`. To get `3.5`, cast an operand first: `(float)7 / 2`.',
          },
          {
            id: 'q-1-3-3',
            question: 'Which of the following is NOT a valid C identifier?',
            options: ['_total_sum', 'count2', '2ndValue', 'maxLimit'],
            correctIndex: 2,
            explanation: 'C identifiers cannot start with a digit; `2ndValue` is illegal.',
          },
          {
            id: 'q-1-3-4',
            question: 'What is the associativity of the assignment operator `=` in C?',
            options: ['Left to right', 'Right to left', 'Undefined', 'Bottom to top'],
            correctIndex: 1,
            explanation: 'Assignment operators associate right-to-left, allowing chained assignments like `a = b = 5;`.',
          },
          {
            id: 'q-1-3-5',
            question: 'Which preprocessor directive defines a symbolic constant in C?',
            options: ['#include', '#define', '#constant', '#typedef'],
            correctIndex: 1,
            explanation: '`#define MAX 100` instructs the preprocessor to substitute `MAX` with `100` before compilation.',
          },
        ],
      },
    ],
  },
  {
    id: 'module-2',
    number: 2,
    title: 'Decision Control, Loops & Functions',
    hours: 13,
    description:
      'Branching logic, iterative loop constructs, jump statements, modular functions, static storage, and recursion.',
    lessons: [
      {
        id: 'm2-decision',
        moduleId: 'module-2',
        number: '2.1',
        title: 'Decision Control Structure in C',
        subtitle: 'if, if-else, if-else-if Ladder, switch & Nesting',
        estimatedMinutes: 25,
        syllabusTopics: [
          'Decision-making statements (if, if-else, if-else-if)',
          'switch-case-default statement',
          'Nesting of decision control structures',
        ],
        sections: [
          {
            title: 'if, if-else, and if-else-if Ladder',
            summary:
              'C treats `0` as false and any non-zero value as true. Branching evaluates conditions sequentially and executes the first matching block.',
            keyPoints: [
              '`if (cond)` runs only when cond != 0.',
              '`if-else` guarantees exactly one of two paths executes.',
              '`if-else-if` ladder evaluates mutually exclusive ranges cleanly (e.g., grading thresholds).',
            ],
          },
          {
            title: 'switch Statement & Nesting',
            summary:
              'When comparing one integer/char expression against multiple constant values, `switch` is cleaner than chained `if-else`. Always place `break;` to avoid fall-through.',
            keyPoints: [
              'Nesting: Placing an `if-else` inside another `if` or `else` handles multi-factor checks (e.g., age AND membership).',
              'Dangling `else` rule: An `else` always pairs with the nearest unmatched `if`. Use `{}` braces to prevent ambiguity.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

int main() {
    int score = 84;
    int choice = 2;

    printf("Input Score: %d\\n", score);
    if (score >= 90) {
        printf("Grade: A (Distinction)\\n");
    } else if (score >= 75) {
        if (score >= 85) {
            printf("Grade: B+ (Merit)\\n");
        } else {
            printf("Grade: B (First Class)\\n");
        }
    } else {
        printf("Grade: C (Pass)\\n");
    }

    printf("\\nMenu Selection #%d -> ", choice);
    switch (choice) {
        case 1:
            printf("View Syllabus\\n");
            break;
        case 2:
            printf("Launch C Compiler\\n");
            break;
        case 3:
            printf("Take Quiz\\n");
            break;
        default:
            printf("Invalid Option\\n");
    }
    return 0;
}`,
        challengePrompt:
          'Remove `break;` after `case 2:` and run the code to observe `switch` fall-through behavior into `case 3`.',
        quiz: [
          {
            id: 'q-2-1-1',
            question: 'What happens if `break;` is omitted at the end of a matched `case` block in a `switch` statement?',
            options: [
              'Compile-time syntax error',
              'Execution exits the switch immediately',
              'Execution falls through into subsequent case blocks',
              'The program restarts main()',
            ],
            correctIndex: 2,
            explanation: 'Without `break;`, C continues executing statements in the following `case` labels until a `break` or closing `}` is reached.',
          },
          {
            id: 'q-2-1-2',
            question: 'Which data types are valid as the controlling expression of a `switch` statement in C?',
            options: ['float and double', 'int and char', 'char arrays (strings)', 'struct types'],
            correctIndex: 1,
            explanation: 'C `switch` expressions must evaluate to an integral type (`int`, `char`, `short`, `long`, `enum`).',
          },
          {
            id: 'q-2-1-3',
            question: 'In `if (x = 0) printf("Yes"); else printf("No");`, what is printed?',
            options: ['Yes', 'No', 'Nothing', 'Compile error'],
            correctIndex: 1,
            explanation: '`x = 0` is an assignment (not `==`), which evaluates to `0` (false), so the `else` branch runs and prints `No`.',
          },
          {
            id: 'q-2-1-4',
            question: 'Without braces, an `else` clause in a nested `if` pairs with:',
            options: ['The outermost if', 'The nearest preceding unmatched if', 'The next if below it', 'A random if'],
            correctIndex: 1,
            explanation: 'By C grammar, an `else` always binds to the closest preceding `if` that lacks an `else`.',
          },
        ],
      },
      {
        id: 'm2-loops',
        moduleId: 'module-2',
        number: '2.2',
        title: 'Loop Control Structure in C',
        subtitle: 'while, do-while, for, Nested Loops & Jumping Statements',
        estimatedMinutes: 30,
        syllabusTopics: [
          'Looping Statements (while, do-while, for)',
          'Nested loops',
          'Jumping statements (break, continue, goto)',
        ],
        sections: [
          {
            title: 'Entry-Controlled vs Exit-Controlled Loops',
            summary:
              'Loops repeat blocks of code. `while` and `for` test the condition before each iteration (0 or more runs), while `do-while` tests after the body (at least 1 run).',
            keyPoints: [
              '`for (init; condition; update)`: Ideal when iteration counts are known.',
              '`while (condition)`: Ideal when looping until an event or sentinel value.',
              '`do { ... } while (condition);`: Runs the body at least once before checking.',
            ],
          },
          {
            title: 'Nested Loops & Jump Statements',
            summary:
              'Placing one loop inside another builds 2D patterns and matrices. Jump statements alter loop flow immediately.',
            keyPoints: [
              '`break`: Terminates the innermost loop or switch immediately.',
              '`continue`: Skips the rest of the current iteration and jumps to the next check/update.',
              '`goto label;`: Unconditional jump within the same function (use sparingly, e.g., breaking out of deeply nested loops).',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

int main() {
    printf("1. Right Triangle (Nested for loops):\\n");
    for (int row = 1; row <= 4; row++) {
        for (int col = 1; col <= row; col++) {
            printf("%d ", col);
        }
        printf("\\n");
    }

    printf("\\n2. Odd numbers < 10 using continue & break:\\n");
    for (int i = 1; i <= 15; i++) {
        if (i > 9) break;
        if (i % 2 == 0) continue;
        printf("%d ", i);
    }

    printf("\\n\\n3. do-while executes at least once:\\n");
    int k = 10;
    do {
        printf("k = %d (checked after body)\\n", k);
    } while (k < 5);

    return 0;
}`,
        challengePrompt:
          'Modify the nested loop to print an inverted triangle (`row` from `4` down to `1`).',
        quiz: [
          {
            id: 'q-2-2-1',
            question: 'Which loop guarantees that its body executes at least once even if the condition is initially false?',
            options: ['for loop', 'while loop', 'do-while loop', 'nested while loop'],
            correctIndex: 2,
            explanation: '`do-while` evaluates its condition at the bottom after executing the body once.',
          },
          {
            id: 'q-2-2-2',
            question: 'What does the `continue` statement do inside a `for` loop?',
            options: [
              'Exits the entire loop permanently',
              'Skips remaining body statements and jumps to the update expression',
              'Restarts the program from main()',
              'Acts identically to goto',
            ],
            correctIndex: 1,
            explanation: '`continue` skips the remainder of the current iteration and proceeds to the `for` loop update and condition check.',
          },
          {
            id: 'q-2-2-3',
            question: 'How many times does the inner `printf` execute in `for(i=0; i<3; i++) for(j=0; j<4; j++) printf("*");`?',
            options: ['7 times', '12 times', '3 times', '4 times'],
            correctIndex: 1,
            explanation: 'The outer loop runs 3 times and for each pass the inner loop runs 4 times: 3 × 4 = 12.',
          },
          {
            id: 'q-2-2-4',
            question: 'Where can a `goto` statement jump to in C?',
            options: [
              'Any label in another function',
              'A label within the same function',
              'Directly into a different .c file',
              'Only backward in code',
            ],
            correctIndex: 1,
            explanation: 'C `goto` is restricted to labels defined within the same enclosing function.',
          },
          {
            id: 'q-2-2-5',
            question: 'Which statement cleanly exits only the innermost enclosing loop?',
            options: ['exit(0)', 'return', 'break', 'continue'],
            correctIndex: 2,
            explanation: '`break` exits the innermost loop or switch; `return` exits the whole function.',
          },
        ],
      },
      {
        id: 'm2-functions',
        moduleId: 'module-2',
        number: '2.3',
        title: 'Functions & Recursion',
        subtitle: 'Prototypes, Call by Value, Static Functions & Recursion',
        estimatedMinutes: 30,
        syllabusTopics: [
          'Concept of library functions & user-defined functions',
          'Passing arguments & Function prototypes',
          'Calling a function',
          'Static functions & static storage',
          'Recursion',
        ],
        sections: [
          {
            title: 'Prototypes, Definitions & Passing Arguments',
            summary:
              'Functions decompose large problems into reusable blocks. A function prototype tells the compiler a function’s return type and parameter types before it is called.',
            keyPoints: [
              'Library functions (`printf`, `sqrt`, `strlen`) come from standard headers; user-defined functions are written by you.',
              'Call by Value: C passes copies of arguments; modifying a parameter inside a function does not alter the caller’s variable.',
            ],
          },
          {
            title: 'Static Functions, Static Locals & Recursion',
            summary:
              '`static` changes linkage or lifetime. A `static` function is visible only inside its own source file; a `static` local variable retains its value across function calls.',
            keyPoints: [
              'Recursion: A function calling itself to solve smaller subproblems until hitting a Base Case.',
              'Every recursive function MUST have a base case to prevent stack overflow.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

// Function prototypes
int factorial(int n);
void trackCalls();

static int helperSquare(int x) {
    return x * x;
}

int main() {
    int n = 5;
    printf("Factorial(%d) = %d\\n", n, factorial(n));
    printf("Static helperSquare(6) = %d\\n\\n", helperSquare(6));

    trackCalls();
    trackCalls();
    trackCalls();
    return 0;
}

int factorial(int n) {
    if (n <= 1) return 1;      // Base case
    return n * factorial(n - 1); // Recursive step
}

void trackCalls() {
    static int count = 0; // Persists across calls in Data segment
    count++;
    printf("trackCalls() invoked #%d\\n", count);
}`,
        challengePrompt:
          'Write a recursive function `int fibonacci(int n)` and print the first 7 Fibonacci numbers from `main()`.',
        quiz: [
          {
            id: 'q-2-3-1',
            question: 'What is the primary purpose of a function prototype in C?',
            options: [
              'To allocate heap memory for parameters',
              'To declare the function signature so the compiler checks calls before its definition',
              'To execute the function automatically',
              'To make a function recursive',
            ],
            correctIndex: 1,
            explanation: 'A prototype informs the compiler of the return type and parameter types before the function is defined.',
          },
          {
            id: 'q-2-3-2',
            question: 'What happens to a `static` local variable inside a function when the function returns?',
            options: [
              'It is destroyed from the stack',
              'It resets to 0 on the next call',
              'It retains its value across multiple function calls',
              'It becomes inaccessible to the function',
            ],
            correctIndex: 2,
            explanation: '`static` local variables live in the Data segment for the entire program lifetime and retain their values between calls.',
          },
          {
            id: 'q-2-3-3',
            question: 'What does marking a function `static` (e.g., `static void helper()`) do?',
            options: [
              'Prevents recursion',
              'Restricts its visibility (linkage) to the current source file',
              'Caches its return value automatically',
              'Forces inline execution',
            ],
            correctIndex: 1,
            explanation: 'A `static` function has internal linkage and cannot be called from other `.c` translation units.',
          },
          {
            id: 'q-2-3-4',
            question: 'What occurs if a recursive function lacks a reachable base case?',
            options: [
              'The compiler auto-inserts return 0;',
              'Infinite recursion leads to Stack Overflow',
              'It converts into a for loop',
              'Only one call executes',
            ],
            correctIndex: 1,
            explanation: 'Each recursive call pushes a frame onto the call stack; without a base case, stack memory runs out.',
          },
          {
            id: 'q-2-3-5',
            question: 'In standard C call-by-value, modifying a parameter inside a function:',
            options: [
              'Modifies the original argument in main()',
              'Modifies only the local copy inside the function',
              'Causes a segmentation fault',
              'Requires malloc()',
            ],
            correctIndex: 1,
            explanation: 'Call-by-value copies the argument into the parameter; changes stay local unless a pointer is passed.',
          },
        ],
      },
    ],
  },
  {
    id: 'module-3',
    number: 3,
    title: 'Arrays, Strings, Pointers, Structures & Unions',
    hours: 13,
    description:
      'Contiguous arrays and matrices, null-terminated strings, pointer arithmetic, function pointers, structs, and unions.',
    lessons: [
      {
        id: 'm3-arrays-strings',
        moduleId: 'module-3',
        number: '3.1',
        title: 'Arrays and Strings',
        subtitle: '1D & 2D Matrices, Passing Arrays & String Library Functions',
        estimatedMinutes: 30,
        syllabusTopics: [
          'Declaration and initialization of arrays',
          'Passing arrays to a function',
          'Matrices as 2D arrays & Multi-dimensional arrays',
          'String handling library functions',
        ],
        sections: [
          {
            title: '1D, 2D Matrices & Passing Arrays to Functions',
            summary:
              'An array stores fixed-size elements of the same type in contiguous RAM (`arr[0]` to `arr[n-1]`). 2D arrays (`int mat[2][3]`) model matrices in row-major order.',
            keyPoints: [
              'Declaration: `int a[5] = {10, 20, 30, 40, 50};` — uninitialized trailing elements become `0`.',
              'Passing arrays: Passing `arr` sends its base memory address, so functions can read/update original elements.',
            ],
          },
          {
            title: 'Strings & `<string.h>` Library Functions',
            summary:
              'In C, a string is a `char` array terminated by the null character `\'\\0\'` (ASCII 0). Always include `<string.h>` for string helpers.',
            keyPoints: [
              '`strlen(s)`: Returns character count excluding `\'\\0\'`.',
              '`strcpy(dest, src)`: Copies `src` into `dest`.',
              '`strcat(dest, src)`: Appends `src` onto the end of `dest`.',
              '`strcmp(a, b)`: Returns `0` if equal, `<0` if `a < b`, `>0` if `a > b`.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>
#include <string.h>

int sumArray(int arr[], int n) {
    int total = 0;
    for (int i = 0; i < n; i++) total += arr[i];
    return total;
}

int main() {
    int nums[5] = {4, 8, 15, 16, 23};
    printf("Array sum = %d\\n\\n", sumArray(nums, 5));

    int mat[2][3] = {{1, 2, 3}, {4, 5, 6}};
    printf("2x3 Matrix:\\n");
    for (int r = 0; r < 2; r++) {
        for (int c = 0; c < 3; c++) {
            printf("%3d ", mat[r][c]);
        }
        printf("\\n");
    }

    char greeting[32] = "Hello, ";
    char lang[] = "C99!";
    strcat(greeting, lang);
    printf("\\nString: %s (length = %d)\\n", greeting, strlen(greeting));
    printf("strcmp(\\"abc\\", \\"abd\\") = %d\\n", strcmp("abc", "abd"));
    return 0;
}`,
        challengePrompt:
          'Compute and print the transpose of `mat[2][3]` as a `3x2` grid using nested loops.',
        quiz: [
          {
            id: 'q-3-1-1',
            question: 'What character marks the end of every standard C string?',
            options: ["'\\n'", "'\\0'", "'EOF'", "' '"],
            correctIndex: 1,
            explanation: "C strings are null-terminated with `'\\0'` (ASCII 0) so functions know where the string ends.",
          },
          {
            id: 'q-3-1-2',
            question: 'What does `strcmp("apple", "apple")` return?',
            options: ['1', '-1', '0', '5'],
            correctIndex: 2,
            explanation: '`strcmp` returns `0` when two strings are lexicographically identical.',
          },
          {
            id: 'q-3-1-3',
            question: 'In `int m[3][4];`, how many total integers are allocated in contiguous row-major memory?',
            options: ['7', '12', '3', '16'],
            correctIndex: 1,
            explanation: '3 rows × 4 columns = 12 integers.',
          },
          {
            id: 'q-3-1-4',
            question: 'When passing an array `scores` to `void update(int a[])`, what is actually passed?',
            options: [
              'A full deep copy of all elements',
              'The base memory address of scores[0]',
              'Only the last element',
              'The array size',
            ],
            correctIndex: 1,
            explanation: 'Arrays decay to a pointer to their first element when passed to functions.',
          },
          {
            id: 'q-3-1-5',
            question: 'What is `strlen("Code")`?',
            options: ['5', '4', '3', '8'],
            correctIndex: 1,
            explanation: '`strlen` counts visible characters (`C`, `o`, `d`, `e` = 4) and excludes the trailing `\\0`.',
          },
        ],
      },
      {
        id: 'm3-pointers',
        moduleId: 'module-3',
        number: '3.2',
        title: 'Pointers & Indirection',
        subtitle: 'Address-of, Arithmetic, Arrays of Pointers & Function Pointers',
        estimatedMinutes: 35,
        syllabusTopics: [
          'Pointer declarations & initialization',
          'Passing pointers to a function',
          'Operations on pointers & Pointer Arithmetic',
          'Pointers and arrays',
          'Arrays of pointers & Function pointers',
        ],
        sections: [
          {
            title: 'Declarations, Passing Pointers & Arithmetic',
            summary:
              'A pointer stores a memory address. `&x` fetches the address of `x`, and `*p` dereferences (reads/writes) the value at that address.',
            keyPoints: [
              'Call by Reference: Passing `&a, &b` lets a `swap(int *x, int *y)` function mutate variables in `main()`.',
              'Pointer Arithmetic: `p + 1` advances by `sizeof(*p)` bytes (e.g., +4 bytes for `int*`, +1 byte for `char*`).',
            ],
          },
          {
            title: 'Pointers & Arrays, Arrays of Pointers & Function Pointers',
            summary:
              '`arr[i]` is syntactic sugar for `*(arr + i)`. Pointers can also hold addresses of strings (`char *names[]`) or executable functions (`int (*op)(int, int)`).',
            keyPoints: [
              'Array of pointers: `char *topics[] = {"Bits", "Loops", "Pointers"};` stores pointers to string literals.',
              'Function pointer: `int (*fn)(int, int) = add;` allows dynamic callbacks and dispatch tables.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int add(int x, int y) { return x + y; }
int mul(int x, int y) { return x * y; }

int main() {
    int x = 10, y = 25;
    swap(&x, &y);
    printf("After swap(&x, &y): x=%d, y=%d\\n", x, y);

    int arr[4] = {100, 200, 300, 400};
    int *p = arr;
    printf("Pointer arithmetic:\\n");
    for (int i = 0; i < 4; i++) {
        printf("  *(p + %d) = %d at %p\\n", i, *(p + i), (p + i));
    }

    // Function pointer demo
    int (*calc)(int, int) = add;
    printf("\\nFunction pointer add(6, 7) = %d\\n", calc(6, 7));
    calc = mul;
    printf("Function pointer mul(6, 7) = %d\\n", calc(6, 7));
    return 0;
}`,
        challengePrompt:
          'Observe the addresses printed by `(p + i)`. Notice each step jumps by 4 bytes (`sizeof(int)`). Try changing `arr` to `double` and watch it jump by 8 bytes!',
        quiz: [
          {
            id: 'q-3-2-1',
            question: 'If `int *p` holds address `0x2000` (and `sizeof(int)` is 4), what address does `p + 2` hold?',
            options: ['0x2002', '0x2004', '0x2008', '0x2010'],
            correctIndex: 2,
            explanation: 'Pointer arithmetic scales by the pointed type size: 0x2000 + 2 × 4 = 0x2008.',
          },
          {
            id: 'q-3-2-2',
            question: 'Which expression is strictly equivalent to `arr[3]` in C?',
            options: ['*arr + 3', '*(arr + 3)', '&arr[3]', 'arr + *3'],
            correctIndex: 1,
            explanation: 'Array indexing `arr[i]` is defined by the C standard as `*(arr + i)`.',
          },
          {
            id: 'q-3-2-3',
            question: 'Which syntax correctly declares a function pointer `fp` to a function taking two `int`s and returning `int`?',
            options: [
              'int *fp(int, int);',
              'int (*fp)(int, int);',
              'func *fp(int, int);',
              'int &(fp)(int, int);',
            ],
            correctIndex: 1,
            explanation: 'Parentheses around `(*fp)` ensure `fp` is a pointer to a function rather than a function returning `int*`.',
          },
          {
            id: 'q-3-2-4',
            question: 'What does the unary `&` operator produce when applied to a variable `x`?',
            options: ['The value of x', 'The bitwise NOT of x', 'The memory address of x', 'The byte size of x'],
            correctIndex: 2,
            explanation: '`&x` evaluates to the memory address where variable `x` is stored.',
          },
          {
            id: 'q-3-2-5',
            question: 'What is `char *names[3]`?',
            options: [
              'A pointer to 3 chars',
              'An array of 3 pointers to char (strings)',
              'A 3D character matrix',
              'A function returning char*',
            ],
            correctIndex: 1,
            explanation: '`[]` binds tighter than `*`, making `names` an array of 3 `char*` pointers.',
          },
        ],
      },
      {
        id: 'm3-structs-unions',
        moduleId: 'module-3',
        number: '3.3',
        title: 'Structures and Unions',
        subtitle: 'struct & union Definitions, Arrays of Structs & -> Operator',
        estimatedMinutes: 25,
        syllabusTopics: [
          'Defining and accessing structure',
          'Structure as function arguments',
          'Array of structures & pointers to structures',
          'Defining and accessing union',
        ],
        sections: [
          {
            title: 'Structures (`struct`) & Pointers to Structures',
            summary:
              'A `struct` groups variables of different types under one record. Each member receives its own separate memory offset.',
            keyPoints: [
              'Dot operator (`.`): Accesses members on a struct value (`s.id`).',
              'Arrow operator (`->`): Accesses members through a struct pointer (`ptr->id`, equivalent to `(*ptr).id`).',
              'Structures can be passed to functions by value (copied) or by pointer (efficient, mutable).',
            ],
          },
          {
            title: 'Unions (`union`) & Shared Memory',
            summary:
              'A `union` looks syntactically like a `struct`, but all members share the exact same starting memory address. Its size equals its largest member.',
            keyPoints: [
              'Only one union member holds a valid value at any instant.',
              'Useful for memory-constrained embedded systems and inspecting raw bytes of a multi-byte value.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

struct Student {
    int roll;
    char grade;
    float gpa;
};

union Data {
    int i;
    char ch;
};

void printStudent(struct Student *ptr) {
    printf("Roll #%d | Grade: %c | GPA: %.2f\\n", ptr->roll, ptr->grade, ptr->gpa);
}

int main() {
    struct Student classList[2] = {
        {101, 'A', 3.92},
        {102, 'B', 3.45}
    };

    printf("sizeof(struct Student) = %d bytes\\n", sizeof(struct Student));
    for (int i = 0; i < 2; i++) {
        printStudent(&classList[i]);
    }

    union Data u;
    u.i = 65; // ASCII 'A'
    printf("\\nsizeof(union Data) = %d bytes (shared memory)\\n", sizeof(union Data));
    printf("u.i = %d -> reading shared byte u.ch = '%c'\\n", u.i, u.ch);
    return 0;
}`,
        challengePrompt:
          'Add a third student to `classList[3]` and compute the average GPA across all 3 students.',
        quiz: [
          {
            id: 'q-3-3-1',
            question: 'Which operator accesses a member through a pointer to a struct (`struct Student *p`)?',
            options: ['p.roll', 'p->roll', 'p::roll', '*p->roll'],
            correctIndex: 1,
            explanation: 'The arrow operator `p->roll` dereferences `p` and accesses the `roll` field.',
          },
          {
            id: 'q-3-3-2',
            question: 'What determines the memory size of a `union`?',
            options: [
              'The sum of all member sizes',
              'The size of its largest member (plus alignment)',
              'Always 4 bytes',
              'The size of its first member',
            ],
            correctIndex: 1,
            explanation: 'Because all members overlap at offset 0 in a `union`, it only needs enough space for its largest member.',
          },
          {
            id: 'q-3-3-3',
            question: 'Why pass a `struct` pointer to a function rather than the `struct` by value?',
            options: [
              'C does not allow passing structs by value',
              'Avoids copying large structs and allows modifying the caller’s struct',
              'Unions require it',
              'It converts the struct into an array',
            ],
            correctIndex: 1,
            explanation: 'Passing a pointer passes only 4/8 bytes (an address) instead of copying the entire structure.',
          },
          {
            id: 'q-3-3-4',
            question: 'In a `union`, if you write `u.x = 10;` and then `u.y = 20;`, what happens to `u.x`?',
            options: [
              'u.x stays 10 safely',
              'u.x is overwritten because both share the same memory',
              'A compile error occurs',
              'u.x moves to the heap',
            ],
            correctIndex: 1,
            explanation: 'Writing to one union member overwrites the shared bytes used by other members.',
          },
        ],
      },
    ],
  },
  {
    id: 'module-4',
    number: 4,
    title: 'Dynamic Memory Allocation & File Handling',
    hours: 8,
    description:
      'Managing runtime heap memory with malloc/calloc/realloc/free and persisting records with C file streams.',
    lessons: [
      {
        id: 'm4-dma',
        moduleId: 'module-4',
        number: '4.1',
        title: 'Dynamic Memory Allocation',
        subtitle: 'malloc, calloc, realloc & free on the Heap',
        estimatedMinutes: 25,
        syllabusTopics: [
          'Introduction to dynamic memory allocation',
          'malloc() and calloc()',
          'realloc() for resizing',
          'free() and preventing memory leaks',
        ],
        sections: [
          {
            title: 'Why Dynamic Allocation (`<stdlib.h>`)?',
            summary:
              'Static arrays have fixed compile-time sizes. Dynamic Memory Allocation reserves exact memory on the Heap at runtime when input sizes aren’t known ahead of time.',
            keyPoints: [
              '`malloc(bytes)`: Allocates a single contiguous block with uninitialized (garbage) contents.',
              '`calloc(count, size)`: Allocates `count * size` bytes and initializes every byte to `0`.',
              '`realloc(ptr, newBytes)`: Resizes an existing heap block while preserving existing data.',
              '`free(ptr)`: Releases heap memory back to the OS to prevent memory leaks.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 3;
    int *arr = (int *)calloc(n, sizeof(int));
    if (arr == NULL) {
        printf("Allocation failed!\\n");
        return 1;
    }

    printf("calloc zero-initialized: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);

    arr[0] = 10; arr[1] = 20; arr[2] = 30;

    // Grow capacity from 3 to 5 ints
    arr = (int *)realloc(arr, 5 * sizeof(int));
    arr[3] = 40;
    arr[4] = 50;

    printf("\\nAfter realloc(5): ");
    for (int i = 0; i < 5; i++) printf("%d ", arr[i]);
    printf("\\n");

    free(arr); // Try commenting this out to see Heap Inspector leak hint!
    return 0;
}`,
        challengePrompt:
          'Open the **Heap** tab in the compiler output panel! Try commenting out `free(arr);` and running again to inspect the unfreed heap block warning.',
        quiz: [
          {
            id: 'q-4-1-1',
            question: 'What is the key difference between `malloc(5 * sizeof(int))` and `calloc(5, sizeof(int))`?',
            options: [
              'malloc allocates on the Stack; calloc on the Heap',
              'calloc zero-initializes all allocated bytes; malloc leaves memory uninitialized',
              'malloc returns int*; calloc returns void*',
              'calloc cannot be freed with free()',
            ],
            correctIndex: 1,
            explanation: '`calloc` clears every allocated byte to 0, whereas `malloc` leaves prior garbage bytes untouched.',
          },
          {
            id: 'q-4-1-2',
            question: 'Which header file declares `malloc`, `calloc`, `realloc`, and `free`?',
            options: ['<stdio.h>', '<string.h>', '<stdlib.h>', '<math.h>'],
            correctIndex: 2,
            explanation: 'All standard dynamic memory management functions are declared in `<stdlib.h>`.',
          },
          {
            id: 'q-4-1-3',
            question: 'What happens if you repeatedly allocate heap memory with `malloc` inside a loop without calling `free`?',
            options: [
              'Automatic garbage collection cleans it up',
              'A memory leak occurs, eventually exhausting heap memory',
              'The compiler converts it to stack memory',
              'Nothing, heap memory clears each iteration',
            ],
            correctIndex: 1,
            explanation: 'C has no garbage collector; unfreed heap allocations stay reserved until the process ends.',
          },
          {
            id: 'q-4-1-4',
            question: 'What does `malloc` return if the system cannot satisfy the requested memory size?',
            options: ['0xFFFF', '-1', 'NULL', 'An uninitialized pointer'],
            correctIndex: 2,
            explanation: 'On allocation failure, `malloc` returns `NULL`, which programs should always check.',
          },
        ],
      },
      {
        id: 'm4-file-handling',
        moduleId: 'module-4',
        number: '4.2',
        title: 'File Handling in C',
        subtitle: 'Opening Streams, Storing, Retrieving & Updating Files',
        estimatedMinutes: 25,
        syllabusTopics: [
          'FILE pointer & fopen() / fclose()',
          'File modes ("r", "w", "a", "r+")',
          'Storing data (fprintf, fputs, fputc)',
          'Retrieving & updating data (fscanf, fgets, fgetc)',
        ],
        sections: [
          {
            title: 'File Operations: Store, Retrieve & Update',
            summary:
              'Variables vanish when a program exits. File streams (`FILE *fp`) persist data to disk across runs using `<stdio.h>`.',
            keyPoints: [
              'Open & Close: `FILE *fp = fopen("log.txt", "w");` ... `fclose(fp);`. Always check `if (fp == NULL)`.',
              'Modes: `"r"` (read existing), `"w"` (create/overwrite), `"a"` (append to end), `"r+"` (read & update).',
              'Writing: `fprintf(fp, ...)` formatted text, `fputs(str, fp)` lines, `fputc(ch, fp)` single chars.',
              'Reading: `fgets(buf, n, fp)` reads lines safely; `fscanf(fp, ...)` parses formatted tokens; `fgetc(fp)` reads until `EOF`.',
            ],
          },
        ],
        starterCode: `#include <stdio.h>

int main() {
    // 1. Store records into a file ("w" mode)
    FILE *fp = fopen("students.txt", "w");
    if (fp == NULL) {
        printf("Error opening file!\\n");
        return 1;
    }
    fprintf(fp, "Alice 94\\n");
    fprintf(fp, "Bob 88\\n");
    fclose(fp);

    // 2. Update/append a new record ("a" mode)
    fp = fopen("students.txt", "a");
    fputs("Charlie 91\\n", fp);
    fclose(fp);

    // 3. Retrieve and print records ("r" mode)
    fp = fopen("students.txt", "r");
    char line[64];
    printf("Contents of students.txt:\\n");
    while (fgets(line, 64, fp) != NULL) {
        printf("  > %s", line);
    }
    fclose(fp);
    return 0;
}`,
        challengePrompt:
          'Run the program and inspect `"students.txt"` inside the **Files** tab of the console! Try adding a fourth student line with `fprintf`.',
        quiz: [
          {
            id: 'q-4-2-1',
            question: 'Which `fopen` mode appends new output to the end of an existing file without erasing its contents?',
            options: ['"w"', '"r"', '"a"', '"x"'],
            correctIndex: 2,
            explanation: '`"a"` (append) preserves existing data and writes at the end; `"w"` truncates existing contents to zero.',
          },
          {
            id: 'q-4-2-2',
            question: 'What does `fopen("missing.txt", "r")` return if `missing.txt` does not exist?',
            options: ['An empty FILE*', 'NULL', 'Creates a blank file', '-1'],
            correctIndex: 1,
            explanation: 'Opening a nonexistent file in read mode (`"r"`) fails and returns `NULL`.',
          },
          {
            id: 'q-4-2-3',
            question: 'Why is calling `fclose(fp)` critical after finishing file writes?',
            options: [
              'It deletes temporary files',
              'It flushes buffered output to disk and releases the file handle',
              'It automatically sorts the file lines',
              'It converts text to binary',
            ],
            correctIndex: 1,
            explanation: '`fclose` flushes any remaining data in the output buffer to storage and frees the OS file descriptor.',
          },
          {
            id: 'q-4-2-4',
            question: 'Which function reads a full line (including spaces) safely up to `n - 1` characters from a `FILE*`?',
            options: ['fscanf()', 'fgetc()', 'fgets()', 'fputs()'],
            correctIndex: 2,
            explanation: '`fgets(buffer, size, fp)` reads up to `size - 1` chars or until a newline, preventing buffer overflows.',
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = SYLLABUS_MODULES.flatMap((m) => m.lessons);

export function getLessonById(id: string): Lesson {
  return ALL_LESSONS.find((l) => l.id === id) ?? ALL_LESSONS[0];
}
