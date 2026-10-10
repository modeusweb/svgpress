/// <reference lib="webworker" />
/**
 * Optimization worker. Runs SVGO off the main thread so the UI never blocks on
 * heavy batches. Communication is message-based and stateless per file.
 */

import { optimizeSvg, describeError } from '@/lib/svgo/optimize';
import type { OptimizerSettings } from '@/types';

export interface OptimizeRequest {
  type: 'optimize';
  id: string;
  runToken: number;
  svg: string;
  settings: OptimizerSettings;
}

export interface OptimizeResponse {
  type: 'result' | 'error';
  id: string;
  runToken: number;
  content?: string;
  size?: number;
  error?: string;
}

export type WorkerRequest = OptimizeRequest;

self.onmessage = (event: MessageEvent<OptimizeRequest>) => {
  const data = event.data;
  if (!data || data.type !== 'optimize') return;

  const respond = (msg: OptimizeResponse) => (self as unknown as Worker).postMessage(msg);

  try {
    const { content, size } = optimizeSvg(data.svg, data.settings);
    respond({ type: 'result', id: data.id, runToken: data.runToken, content, size });
  } catch (err) {
    respond({ type: 'error', id: data.id, runToken: data.runToken, error: describeError(err) });
  }
};
