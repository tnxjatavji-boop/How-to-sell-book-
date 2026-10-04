/**
 * Performance & Latency Telemetry Engine
 * Tracks real-time FPS, Frame Times, and API Move Latencies.
 */

export interface ApiLogEntry {
  id: string;
  endpoint: string;
  action: string;
  durationMs: number;
  status: number | string;
  timestamp: Date;
  isGameMove: boolean;
}

export interface PerformanceStats {
  fps: number;
  avgFps: number;
  minFps: number;
  frameTimeMs: number;
  lastMoveLatencyMs: number | null;
  avgMoveLatencyMs: number | null;
  minMoveLatencyMs: number | null;
  maxMoveLatencyMs: number | null;
  totalMoveRequests: number;
  recentLogs: ApiLogEntry[];
  fpsHistory: number[];
}

type Listener = (stats: PerformanceStats) => void;

class PerformanceTracker {
  private listeners: Set<Listener> = new Set();
  private logs: ApiLogEntry[] = [];
  private fpsHistory: number[] = [];
  
  private currentFps = 60;
  private avgFps = 60;
  private minFps = 60;
  private frameTimeMs = 16.6;
  private lastMoveLatencyMs: number | null = null;

  private frameCount = 0;
  private lastFpsUpdateTime = performance.now();
  private lastFrameTimestamp = performance.now();
  private animFrameId: number | null = null;
  private isTracking = false;

  constructor() {
    this.startFpsTracking();
  }

  public startFpsTracking() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.lastFpsUpdateTime = performance.now();
    this.lastFrameTimestamp = performance.now();

    const loop = (now: number) => {
      this.frameCount++;
      const delta = now - this.lastFrameTimestamp;
      this.lastFrameTimestamp = now;
      this.frameTimeMs = Math.round(delta * 10) / 10;

      // Update FPS calculation every 500ms
      if (now - this.lastFpsUpdateTime >= 500) {
        const elapsed = (now - this.lastFpsUpdateTime) / 1000;
        const computedFps = Math.min(60, Math.round(this.frameCount / elapsed));
        this.currentFps = computedFps;
        this.frameCount = 0;
        this.lastFpsUpdateTime = now;

        // Keep last 30 FPS data points for sparkline
        this.fpsHistory.push(computedFps);
        if (this.fpsHistory.length > 30) {
          this.fpsHistory.shift();
        }

        // Calculate average and min FPS
        if (this.fpsHistory.length > 0) {
          const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
          this.avgFps = Math.round(sum / this.fpsHistory.length);
          this.minFps = Math.min(...this.fpsHistory);
        }

        this.notify();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopFpsTracking() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isTracking = false;
  }

  public recordApiCall(
    endpoint: string,
    action: string,
    durationMs: number,
    status: number | string = 200,
    isGameMove: boolean = true
  ) {
    const entry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      endpoint,
      action,
      durationMs: Math.round(durationMs),
      status,
      timestamp: new Date(),
      isGameMove,
    };

    this.logs.unshift(entry);
    if (this.logs.length > 50) {
      this.logs.pop();
    }

    if (isGameMove) {
      this.lastMoveLatencyMs = entry.durationMs;
    }

    this.notify();
  }

  public getStats(): PerformanceStats {
    const moveLogs = this.logs.filter((l) => l.isGameMove);
    const totalMoveRequests = moveLogs.length;

    let avgMoveLatencyMs: number | null = null;
    let minMoveLatencyMs: number | null = null;
    let maxMoveLatencyMs: number | null = null;

    if (totalMoveRequests > 0) {
      const latencies = moveLogs.map((l) => l.durationMs);
      const sum = latencies.reduce((a, b) => a + b, 0);
      avgMoveLatencyMs = Math.round(sum / totalMoveRequests);
      minMoveLatencyMs = Math.min(...latencies);
      maxMoveLatencyMs = Math.max(...latencies);
    }

    return {
      fps: this.currentFps,
      avgFps: this.avgFps,
      minFps: this.minFps,
      frameTimeMs: this.frameTimeMs,
      lastMoveLatencyMs: this.lastMoveLatencyMs,
      avgMoveLatencyMs,
      minMoveLatencyMs,
      maxMoveLatencyMs,
      totalMoveRequests,
      recentLogs: this.logs.slice(0, 20),
      fpsHistory: [...this.fpsHistory],
    };
  }

  public clearStats() {
    this.logs = [];
    this.fpsHistory = [];
    this.lastMoveLatencyMs = null;
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.listeners.size === 0) return;
    const stats = this.getStats();
    this.listeners.forEach((listener) => listener(stats));
  }
}

export const perfTracker = new PerformanceTracker();

/**
 * High-precision API Latency Timer utility
 */
export async function measureApiCall<T>(
  endpoint: string,
  action: string,
  fn: () => Promise<T>,
  isGameMove: boolean = true
): Promise<T> {
  const start = performance.now();
  let status: number | string = 200;
  try {
    const result = await fn();
    const duration = performance.now() - start;
    if (result && typeof result === "object" && "status" in result) {
      status = (result as any).status || 200;
    }
    perfTracker.recordApiCall(endpoint, action, duration, status, isGameMove);
    return result;
  } catch (error: any) {
    const duration = performance.now() - start;
    status = error?.status || "ERR";
    perfTracker.recordApiCall(endpoint, action, duration, status, isGameMove);
    throw error;
  }
}
