/**
 * Polyfills for Node.js globals (Buffer) required by @solana/spl-token in browser
 */
import { Buffer } from 'buffer';

(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
