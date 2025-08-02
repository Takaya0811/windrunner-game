/**
 * 最適化された衝突判定システム
 * 空間分割とオブジェクトプールを使用した高速衝突判定
 */

import { Character, Obstacle, Collectible, Rectangle } from '@/types/game';

// 衝突判定の結果
export interface CollisionResult {
  hasCollision: boolean;
  collidingObjects: Array<Obstacle | Collectible>;
  penetrationDepth?: number;
  collisionNormal?: { x: number; y: number };
}

// 空間分割のセル
interface SpatialCell {
  x: number;
  y: number;
  width: number;
  height: number;
  objects: Array<Obstacle | Collectible>;
}

// バウンディングボックスの最適化版
interface OptimizedBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class CollisionSystem {
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private grid: SpatialCell[][] = [];
  private canvasWidth: number;
  private canvasHeight: number;

  // オブジェクトプール（メモリ最適化）
  private collisionResultPool: CollisionResult[] = [];
  private boundsPool: OptimizedBounds[] = [];

  constructor(canvasWidth: number, canvasHeight: number, cellSize = 100) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(canvasWidth / cellSize);
    this.gridHeight = Math.ceil(canvasHeight / cellSize);
    
    this.initializeGrid();
    this.initializePools();
  }

  /**
   * 空間分割グリッドの初期化
   */
  private initializeGrid(): void {
    this.grid = [];
    for (let x = 0; x < this.gridWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        this.grid[x][y] = {
          x: x * this.cellSize,
          y: y * this.cellSize,
          width: this.cellSize,
          height: this.cellSize,
          objects: []
        };
      }
    }
  }

  /**
   * オブジェクトプールの初期化
   */
  private initializePools(): void {
    // 衝突結果プール
    for (let i = 0; i < 50; i++) {
      this.collisionResultPool.push({
        hasCollision: false,
        collidingObjects: []
      });
    }

    // バウンディングボックスプール
    for (let i = 0; i < 100; i++) {
      this.boundsPool.push({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
      });
    }
  }

  /**
   * フレーム開始時のグリッドクリア
   */
  public clearGrid(): void {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        this.grid[x][y].objects.length = 0; // 配列の長さをリセット（メモリ再利用）
      }
    }
  }

  /**
   * オブジェクトをグリッドに追加
   */
  public addObjectToGrid(obj: Obstacle | Collectible): void {
    const bounds = this.getBounds(obj);
    const startX = Math.max(0, Math.floor(bounds.minX / this.cellSize));
    const endX = Math.min(this.gridWidth - 1, Math.floor(bounds.maxX / this.cellSize));
    const startY = Math.max(0, Math.floor(bounds.minY / this.cellSize));
    const endY = Math.min(this.gridHeight - 1, Math.floor(bounds.maxY / this.cellSize));

    // オブジェクトが跨るセルすべてに追加
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        this.grid[x][y].objects.push(obj);
      }
    }

    this.returnBounds(bounds);
  }

  /**
   * キャラクターとの衝突判定（最適化版）
   */
  public checkCharacterCollisions(character: Character): CollisionResult {
    const result = this.getCollisionResult();
    const characterBounds = this.getBounds(character);
    
    // キャラクターが存在するセルを特定
    const startX = Math.max(0, Math.floor(characterBounds.minX / this.cellSize));
    const endX = Math.min(this.gridWidth - 1, Math.floor(characterBounds.maxX / this.cellSize));
    const startY = Math.max(0, Math.floor(characterBounds.minY / this.cellSize));
    const endY = Math.min(this.gridHeight - 1, Math.floor(characterBounds.maxY / this.cellSize));

    // 該当セル内のオブジェクトのみチェック
    const checkedObjects = new Set<Obstacle | Collectible>();
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const cell = this.grid[x][y];
        
        for (const obj of cell.objects) {
          if (checkedObjects.has(obj)) continue;
          checkedObjects.add(obj);
          
          if (this.fastAABBCheck(characterBounds, this.getBounds(obj))) {
            result.hasCollision = true;
            result.collidingObjects.push(obj);
            
            // 詳細な衝突情報が必要な場合
            if (this.needsDetailedCollision(obj)) {
              const details = this.calculateCollisionDetails(character, obj);
              result.penetrationDepth = details.penetrationDepth;
              result.collisionNormal = details.normal;
            }
          }
        }
      }
    }

    this.returnBounds(characterBounds);
    return result;
  }

  /**
   * 高速AABB判定
   */
  private fastAABBCheck(bounds1: OptimizedBounds, bounds2: OptimizedBounds): boolean {
    return bounds1.minX < bounds2.maxX &&
           bounds1.maxX > bounds2.minX &&
           bounds1.minY < bounds2.maxY &&
           bounds1.maxY > bounds2.minY;
  }

  /**
   * バウンディングボックスを取得（プール使用）
   */
  private getBounds(rect: Rectangle): OptimizedBounds {
    const bounds = this.boundsPool.pop() || {
      minX: 0, maxX: 0, minY: 0, maxY: 0
    };
    
    bounds.minX = rect.x;
    bounds.maxX = rect.x + rect.width;
    bounds.minY = rect.y;
    bounds.maxY = rect.y + rect.height;
    
    return bounds;
  }

  /**
   * バウンディングボックスをプールに返却
   */
  private returnBounds(bounds: OptimizedBounds): void {
    this.boundsPool.push(bounds);
  }

  /**
   * 衝突結果をプールから取得
   */
  private getCollisionResult(): CollisionResult {
    const result = this.collisionResultPool.pop() || {
      hasCollision: false,
      collidingObjects: []
    };
    
    result.hasCollision = false;
    result.collidingObjects.length = 0;
    result.penetrationDepth = undefined;
    result.collisionNormal = undefined;
    
    return result;
  }

  /**
   * 衝突結果をプールに返却
   */
  public returnCollisionResult(result: CollisionResult): void {
    this.collisionResultPool.push(result);
  }

  /**
   * 詳細な衝突情報が必要かどうかを判定
   */
  private needsDetailedCollision(obj: Obstacle | Collectible): boolean {
    // 障害物の場合のみ詳細な情報を計算
    return 'type' in obj;
  }

  /**
   * 詳細な衝突情報を計算
   */
  private calculateCollisionDetails(character: Character, obj: Rectangle): {
    penetrationDepth: number;
    normal: { x: number; y: number };
  } {
    const charCenterX = character.x + character.width / 2;
    const charCenterY = character.y + character.height / 2;
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;

    const deltaX = charCenterX - objCenterX;
    const deltaY = charCenterY - objCenterY;

    const minDistanceX = (character.width + obj.width) / 2;
    const minDistanceY = (character.height + obj.height) / 2;

    const penetrationX = minDistanceX - Math.abs(deltaX);
    const penetrationY = minDistanceY - Math.abs(deltaY);

    let penetrationDepth: number;
    let normal: { x: number; y: number };

    if (penetrationX < penetrationY) {
      penetrationDepth = penetrationX;
      normal = { x: deltaX > 0 ? 1 : -1, y: 0 };
    } else {
      penetrationDepth = penetrationY;
      normal = { x: 0, y: deltaY > 0 ? 1 : -1 };
    }

    return { penetrationDepth, normal };
  }

  /**
   * 特定タイプのオブジェクトとの衝突チェック
   */
  public checkCollisionWithType<T extends Obstacle | Collectible>(
    character: Character,
    filter: (obj: Obstacle | Collectible) => obj is T
  ): T[] {
    const result = this.checkCharacterCollisions(character);
    const filtered = result.collidingObjects.filter(filter);
    this.returnCollisionResult(result);
    return filtered;
  }

  /**
   * 収集アイテムとの衝突チェック
   */
  public checkCollectibleCollisions(character: Character): Collectible[] {
    return this.checkCollisionWithType(character, (obj): obj is Collectible => 
      'collected' in obj && !obj.collected
    );
  }

  /**
   * 障害物との衝突チェック
   */
  public checkObstacleCollisions(character: Character): Obstacle[] {
    return this.checkCollisionWithType(character, (obj): obj is Obstacle => 
      'type' in obj
    );
  }

  /**
   * システムのパフォーマンス情報を取得
   */
  public getPerformanceInfo(): {
    gridSize: string;
    cellSize: number;
    activeCells: number;
    totalObjects: number;
    availableResultPool: number;
    availableBoundsPool: number;
  } {
    let totalObjects = 0;
    let activeCells = 0;

    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const cell = this.grid[x][y];
        if (cell.objects.length > 0) {
          activeCells++;
          totalObjects += cell.objects.length;
        }
      }
    }

    return {
      gridSize: `${this.gridWidth}x${this.gridHeight}`,
      cellSize: this.cellSize,
      activeCells,
      totalObjects,
      availableResultPool: this.collisionResultPool.length,
      availableBoundsPool: this.boundsPool.length
    };
  }

  /**
   * グリッドの可視化用データを取得（デバッグ用）
   */
  public getDebugGrid(): SpatialCell[][] {
    return this.grid;
  }
}