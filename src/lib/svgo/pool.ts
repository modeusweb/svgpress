import type { OptimizerSettings } from '@/types';
import { optimizeSvg } from '@/lib/svgo/optimize';

export interface PoolTask {
  id: string;
  runToken: number;
  svg: string;
  settings: OptimizerSettings;
}

export interface PoolResult {
  id: string;
  runToken: number;
  content: string;
  size: number;
}

/** Shape of the message posted from the optimization worker. */
interface WorkerMessage {
  type: 'result' | 'error';
  id: string;
  runToken: number;
  content?: string;
  size?: number;
  error?: string;
}

export interface PoolError {
  id: string;
  runToken: number;
  error: string;
}

type ResultHandler = (r: PoolResult) => void;
type ErrorHandler = (e: PoolError) => void;

interface WorkerJob {
  worker: Worker;
  busy: boolean;
}

/**
 * A fixed-size pool of optimization workers. We try to use real Web Workers so
 * the main thread stays responsive. If workers are unavailable (SSR, tests),
 * we transparently fall back to running SVGO on the main thread - still
 * correct, just not off-loaded.
 */
export class WorkerPool {
  private jobs: PoolTask[] = [];
  private workers: WorkerJob[] = [];
  private readonly size: number;
  private cancelled = false;
  private fallback = false;

  onResult: ResultHandler = () => {};
  onError: ErrorHandler = () => {};

  constructor(size: number) {
    this.size = Math.max(1, Math.min(size, 8));
    this.init();
  }

  private init(): void {
    if (typeof Worker === 'undefined') {
      this.fallback = true;
      return;
    }
    try {
      for (let i = 0; i < this.size; i++) {
        const worker = new Worker(new URL('./optimize.worker.ts', import.meta.url), {
          type: 'module',
        });
        const job: WorkerJob = { worker, busy: false };
        worker.onmessage = (ev) => this.handleMessage(job, ev.data);
        worker.onerror = () => {
          // If a worker fails catastrophically, degrade gracefully.
          this.fallback = true;
        };
        this.workers.push(job);
      }
    } catch {
      this.fallback = true;
      this.workers.forEach((j) => j.worker.terminate());
      this.workers = [];
    }
  }

  private handleMessage(job: WorkerJob, data: WorkerMessage): void {
    job.busy = false;
    if (data?.type === 'error') {
      this.onError({ id: data.id, runToken: data.runToken, error: data.error ?? 'Unknown error' });
    } else {
      this.onResult({
        id: data.id,
        runToken: data.runToken,
        content: data.content ?? '',
        size: data.size ?? 0,
      });
    }
    this.pump();
  }

  private pump(): void {
    if (this.cancelled) return;
    if (this.fallback) {
      this.drainFallback();
      return;
    }
    for (const job of this.workers) {
      if (job.busy) continue;
      const task = this.jobs.shift();
      if (!task) return;
      job.busy = true;
      job.worker.postMessage({ type: 'optimize', ...task });
    }
  }

  private drainFallback(): void {
    const task = this.jobs.shift();
    if (!task) return;
    // Yield to the event loop between tasks to keep the UI responsive.
    setTimeout(() => {
      try {
        const { content, size } = optimizeSvg(task.svg, task.settings);
        this.onResult({ id: task.id, runToken: task.runToken, content, size });
      } catch (err) {
        this.onError({
          id: task.id,
          runToken: task.runToken,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      this.drainFallback();
    }, 0);
  }

  enqueue(tasks: PoolTask[]): void {
    this.jobs.push(...tasks);
    this.pump();
  }

  cancel(): void {
    this.cancelled = true;
    this.jobs = [];
    this.workers.forEach((j) => j.worker.terminate());
    this.workers = [];
  }

  get pending(): number {
    return this.jobs.length;
  }

  get active(): number {
    return this.workers.filter((j) => j.busy).length;
  }

  get isFallback(): boolean {
    return this.fallback;
  }
}
