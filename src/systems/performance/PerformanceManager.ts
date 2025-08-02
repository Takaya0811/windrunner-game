/**
 * パフォーマンス管理システム
 * メモリ使用量の最適化とフレームレート管理
 */

// フレームレート統計
interface FrameStats {
  fps: number;
  averageFps: number;
  frameTime: number;
  averageFrameTime: number;
  worstFrameTime: number;
  frameCount: number;
}

// メモリ統計
interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  gcCount: number;
  lastGcTime: number;
}

// パフォーマンス統計
interface PerformanceStats {
  frame: FrameStats;
  memory: MemoryStats;
  renderTime: number;
  updateTime: number;
  collisionTime: number;
  animationTime: number;
}

// オブジェクトプール管理
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    
    // プールを初期サイズで埋める
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  getStats(): { available: number; maxSize: number } {
    return {
      available: this.pool.length,
      maxSize: this.maxSize
    };
  }
}

export class PerformanceManager {
  private stats: PerformanceStats;
  private frameStartTime = 0;
  private frameEndTime = 0;
  private frameHistory: number[] = [];
  private lastFrameTime = 0;
  private gcObserver?: PerformanceObserver;
  
  // オブジェクトプール
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private objectPools = new Map<string, ObjectPool<any>>();
  
  // パフォーマンス監視フラグ
  private monitoring = false;
  private adaptiveQuality = true;
  private targetFps = 60;
  private currentQuality = 1.0; // 0.1 - 1.0

  constructor() {
    this.stats = {
      frame: {
        fps: 60,
        averageFps: 60,
        frameTime: 16.67,
        averageFrameTime: 16.67,
        worstFrameTime: 16.67,
        frameCount: 0
      },
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        gcCount: 0,
        lastGcTime: 0
      },
      renderTime: 0,
      updateTime: 0,
      collisionTime: 0,
      animationTime: 0
    };

    this.initializeObjectPools();
    this.setupGCObserver();
  }

  /**
   * オブジェクトプールの初期化
   */
  private initializeObjectPools(): void {
    // 障害物プール
    this.createObjectPool('obstacle', 
      () => ({ x: 0, y: 0, width: 0, height: 0, type: 'cactus' as const }),
      (obj) => { obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0; }
    );

    // 収集アイテムプール
    this.createObjectPool('collectible',
      () => ({ x: 0, y: 0, width: 0, height: 0, collected: false }),
      (obj) => { obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0; obj.collected = false; }
    );

    // パーティクルプール（将来の使用を想定）
    this.createObjectPool('particle',
      () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 1, color: '#fff' }),
      (obj) => { obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0; obj.life = 1; }
    );
  }

  /**
   * オブジェクトプールを作成
   */
  public createObjectPool<T>(
    name: string, 
    createFn: () => T, 
    resetFn: (obj: T) => void,
    initialSize = 20,
    maxSize = 200
  ): void {
    this.objectPools.set(name, new ObjectPool(createFn, resetFn, initialSize, maxSize));
  }

  /**
   * オブジェクトプールからオブジェクトを取得
   */
  public getFromPool<T>(poolName: string): T | null {
    const pool = this.objectPools.get(poolName);
    return pool ? pool.get() : null;
  }

  /**
   * オブジェクトをプールに返却
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public returnToPool(poolName: string, obj: any): void {
    const pool = this.objectPools.get(poolName);
    if (pool) {
      pool.release(obj);
    }
  }

  /**
   * GCオブザーバーの設定
   */
  private setupGCObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.gcObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure' && entry.name === 'gc') {
              this.stats.memory.gcCount++;
              this.stats.memory.lastGcTime = entry.startTime;
            }
          }
        });
        this.gcObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('GC monitoring not available:', error);
      }
    }
  }

  /**
   * パフォーマンス監視開始
   */
  public startMonitoring(): void {
    this.monitoring = true;
    this.frameStartTime = performance.now();
  }

  /**
   * フレーム開始
   */
  public startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * フレーム終了
   */
  public endFrame(): void {
    if (!this.monitoring) return;

    this.frameEndTime = performance.now();
    const frameTime = this.frameEndTime - this.frameStartTime;
    
    this.updateFrameStats(frameTime);
    this.updateMemoryStats();
    
    if (this.adaptiveQuality) {
      this.adjustQuality();
    }
  }

  /**
   * 特定処理時間の測定開始
   */
  public startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * 特定処理時間の測定終了
   */
  public endMeasure(name: string): number {
    const endMark = `${name}-end`;
    performance.mark(endMark);
    performance.measure(name, `${name}-start`, endMark);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure ? measure.duration : 0;
    
    // 統計に記録
    switch (name) {
      case 'render':
        this.stats.renderTime = duration;
        break;
      case 'update':
        this.stats.updateTime = duration;
        break;
      case 'collision':
        this.stats.collisionTime = duration;
        break;
      case 'animation':
        this.stats.animationTime = duration;
        break;
    }
    
    return duration;
  }

  /**
   * フレーム統計の更新
   */
  private updateFrameStats(frameTime: number): void {
    this.stats.frame.frameCount++;
    this.stats.frame.frameTime = frameTime;
    this.stats.frame.fps = 1000 / frameTime;
    
    // フレーム履歴の管理（直近60フレーム）
    this.frameHistory.push(frameTime);
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }
    
    // 平均値の計算
    const sum = this.frameHistory.reduce((a, b) => a + b, 0);
    this.stats.frame.averageFrameTime = sum / this.frameHistory.length;
    this.stats.frame.averageFps = 1000 / this.stats.frame.averageFrameTime;
    
    // 最悪フレーム時間の更新
    this.stats.frame.worstFrameTime = Math.max(
      this.stats.frame.worstFrameTime, 
      frameTime
    );
  }

  /**
   * メモリ統計の更新
   */
  private updateMemoryStats(): void {
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      this.stats.memory.usedJSHeapSize = memory.usedJSHeapSize;
      this.stats.memory.totalJSHeapSize = memory.totalJSHeapSize;
      this.stats.memory.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }
  }

  /**
   * 品質の自動調整
   */
  private adjustQuality(): void {
    const avgFps = this.stats.frame.averageFps;
    const targetFps = this.targetFps;
    
    if (avgFps < targetFps * 0.8) {
      // フレームレートが低い場合、品質を下げる
      this.currentQuality = Math.max(0.1, this.currentQuality - 0.1);
    } else if (avgFps > targetFps * 0.95 && this.currentQuality < 1.0) {
      // フレームレートが安定している場合、品質を上げる
      this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
    }
  }

  /**
   * 現在の品質設定を取得
   */
  public getCurrentQuality(): number {
    return this.currentQuality;
  }

  /**
   * パフォーマンス統計を取得
   */
  public getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * オブジェクトプールの統計を取得
   */
  public getPoolStats(): Record<string, { available: number; maxSize: number }> {
    const stats: Record<string, { available: number; maxSize: number }> = {};
    for (const [name, pool] of this.objectPools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * メモリクリーンアップの実行
   */
  public cleanupMemory(): void {
    // オブジェクトプールのクリア
    for (const [, pool] of this.objectPools) {
      // プールサイズを最小限に削減
      const stats = pool.getStats();
      const keepCount = Math.min(5, stats.available);
      for (let i = stats.available; i > keepCount; i--) {
        pool.get(); // オブジェクトを取得して破棄
      }
    }

    // パフォーマンス履歴のクリア
    this.frameHistory.length = Math.min(this.frameHistory.length, 30);
    
    // 手動GCの実行（可能な場合）
    if ('gc' in window && typeof (window as { gc?: () => void }).gc === 'function') {
      (window as { gc: () => void }).gc();
    }
  }

  /**
   * パフォーマンス監視の停止
   */
  public stopMonitoring(): void {
    this.monitoring = false;
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }
  }

  /**
   * 設定変更
   */
  public configure(options: {
    targetFps?: number;
    adaptiveQuality?: boolean;
  }): void {
    if (options.targetFps !== undefined) {
      this.targetFps = options.targetFps;
    }
    if (options.adaptiveQuality !== undefined) {
      this.adaptiveQuality = options.adaptiveQuality;
    }
  }

  /**
   * デバッグ用のパフォーマンス情報をコンソールに出力
   */
  public logDebugInfo(): void {
    console.group('Performance Stats');
    console.log('FPS:', this.stats.frame.fps.toFixed(1));
    console.log('Average FPS:', this.stats.frame.averageFps.toFixed(1));
    console.log('Frame Time:', this.stats.frame.frameTime.toFixed(2), 'ms');
    console.log('Quality:', (this.currentQuality * 100).toFixed(0), '%');
    console.log('Memory Usage:', (this.stats.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('Pool Stats:', this.getPoolStats());
    console.groupEnd();
  }
}