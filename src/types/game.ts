/**
 * ゲームで使用する型定義ファイル
 * 
 * このファイルは、ゲーム全体で使用するデータ構造を定義します。
 * 初心者向け解説：
 * - 「型」とは、データの形や種類を決めるルールのこと
 * - 例：「Character」は「キャラクター」のデータ構造を定義
 * - TypeScriptが間違いを事前に見つけてくれるため、バグが減る
 */

// キャラクター（プレイヤー）の情報を管理する型
export interface Character {
  x: number;              // 横位置（ピクセル）
  y: number;              // 縦位置（ピクセル）
  width: number;          // 幅（ピクセル）
  height: number;         // 高さ（ピクセル）
  velocityY: number;      // 縦方向の速度（ジャンプ・落下）
  isJumping: boolean;     // ジャンプ中かどうか
  animationFrame: number; // アニメーション用のフレーム数
}

// 障害物の情報を管理する型
export interface Obstacle {
  x: number;                    // 横位置（ピクセル）
  y: number;                    // 縦位置（ピクセル）
  width: number;                // 幅（ピクセル）
  height: number;               // 高さ（ピクセル）
  type: 'spike' | 'bird';       // 障害物の種類（金属スパイクまたは鳥）
  baseY?: number;               // 基準Y位置（鳥の上下動作用）
  animationTime?: number;       // アニメーション時間（鳥の上下動作用）
  velocityX?: number;           // X方向の速度（鳥の追跡用）
  velocityY?: number;           // Y方向の速度（鳥の追跡用）
  isTracking?: boolean;         // 追跡中かどうか（鳥用）
}

// 収集可能アイテムの情報を管理する型
export interface Collectible {
  x: number;           // 横位置（ピクセル）
  y: number;           // 縦位置（ピクセル）
  width: number;       // 幅（ピクセル）
  height: number;      // 高さ（ピクセル）
  collected: boolean;  // 収集済みかどうか
}

// ゲームの全体的な状態を管理する型
export interface GameState {
  gameStarted: boolean;      // ゲームが開始されているか
  gameOver: boolean;         // ゲームオーバーか
  score: number;             // 現在のスコア
  gameSpeed: number;         // ゲームの速度
  character: Character;      // キャラクター情報
  obstacles: Obstacle[];     // 障害物のリスト
  collectibles: Collectible[]; // 収集アイテムのリスト
}

// 衝突判定で使用する矩形の型
export interface Rectangle {
  x: number;      // 横位置
  y: number;      // 縦位置
  width: number;  // 幅
  height: number; // 高さ
}

// キー入力の状態を管理する型
export interface KeyState {
  [key: string]: boolean;  // キーが押されているかどうか
}