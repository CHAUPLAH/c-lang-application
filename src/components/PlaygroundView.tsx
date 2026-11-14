import React, { useState } from 'react';
import { CodeCompiler } from './CodeCompiler';

const PLAYGROUND_PRESETS = [
  {
    label: 'Hello & Types',
    code: `#include <stdio.h>

int main() {
    int age = 20;
    float gpa = 3.85;
    char grade = 'A';

    printf("Age: %d | GPA: %.2f | Grade: %c\\n", age, gpa, grade);
    printf("sizeof(int)=%d, sizeof(double)=%d\\n", sizeof(int), sizeof(double));
    return 0;
}`,
  },
  {
    label: 'Scanf Input',
    stdin: '12 8',
    code: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d + %d = %d\\n", a, b, a + b);
    printf("Avg: %.2f\\n", (float)(a + b) / 2);
    return 0;
}`,
  },
  {
    label: 'Pointers & Swap',
    code: `#include <stdio.h>

void swap(int *x, int *y) {
    int tmp = *x;
    *x = *y;
    *y = tmp;
}

int main() {
    int a = 10, b = 99;
    swap(&a, &b);
    printf("Swapped: a=%d, b=%d\\n", a, b);
    return 0;
}`,
  },
  {
    label: 'Malloc & Free',
    code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int *nums = (int *)malloc(4 * sizeof(int));
    for (int i = 0; i < 4; i++) {
        nums[i] = (i + 1) * 10;
        printf("nums[%d] = %d\\n", i, nums[i]);
    }
    free(nums);
    return 0;
}`,
  },
  {
    label: 'File I/O',
    code: `#include <stdio.h>

int main() {
    FILE *fp = fopen("practice.txt", "w");
    fprintf(fp, "Line 1: C File Stream\\nLine 2: Saved in browser!\\n");
    fclose(fp);

    fp = fopen("practice.txt", "r");
    char buf[64];
    while (fgets(buf, 64, fp) != NULL) {
        printf("%s", buf);
    }
    fclose(fp);
    return 0;
}`,
  },
];

export function PlaygroundView() {
  const [code, setCode] = useState(PLAYGROUND_PRESETS[0].code);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Real-Time C Compiler
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Write and run C99 programs directly in your browser—works offline, on mobile, with live syntax checks, Heap tracking, and virtual File I/O.
        </p>
      </div>

      <CodeCompiler
        code={code}
        onChange={setCode}
        starterCode={PLAYGROUND_PRESETS[0].code}
        presets={PLAYGROUND_PRESETS}
      />
    </div>
  );
}
