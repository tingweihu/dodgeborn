import { test as nodeTest } from 'node:test';

// The same gameplay scenarios run in offline Node and in Vitest once npm packages are available.
export const test = (process.env.VITEST ? (await import('vitest')).test : nodeTest) as unknown as typeof nodeTest;
