import { rmSync } from 'node:fs';

// Remove only generated build output, including the previous static layout.
rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
