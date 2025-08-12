/**
 * 衝突判定処理を管理するファイル
 * 
 * このファイルは、ゲーム内の全ての衝突判定処理を管理します。
 * 初心者向け解説：
 * - 「衝突判定」とは、2つのオブジェクトが重なっているかを判定する処理
 * - 例：プレイヤーと障害物が重なったか、プレイヤーとアイテムが重なったか
 * - ゲームの当たり判定を正確に行うために重要な機能
 */

import { Character, Obstacle, Collectible, Rectangle } from '@/types/game';

/**
 * 2つの矩形が衝突しているかどうかを判定する関数
 * 
 * @param rect1 - 1つ目の矩形オブジェクト
 * @param rect2 - 2つ目の矩形オブジェクト
 * @returns 衝突している場合はtrue、していない場合はfalse
 * 
 * 初心者向け解説：
 * この関数は「AABB（Axis-Aligned Bounding Box）」という手法を使用しています。
 * これは、2つの矩形が重なっているかを効率的に判定する方法です。
 */
export const checkCollision = (rect1: Rectangle, rect2: Rectangle): boolean => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
};

/**
 * キャラクターと障害物の衝突判定
 * 
 * @param character - キャラクター情報
 * @param obstacle - 障害物情報
 * @returns 衝突している場合はtrue、していない場合はfalse
 */
export const checkCharacterObstacleCollision = (character: Character, obstacle: Obstacle): boolean => {
  // 落とし穴の場合は衝突判定なし（別の仕組みで落下処理）
  if (obstacle.type === 'pitfall') {
    return false;
  }
  
  // 通常の障害物の場合は従来の衝突判定
  return checkCollision(character, obstacle);
};

/**
 * キャラクターと収集アイテムの衝突判定
 * 
 * @param character - キャラクター情報
 * @param collectible - 収集アイテム情報
 * @returns 衝突している場合はtrue、していない場合はfalse
 */
export const checkCharacterCollectibleCollision = (character: Character, collectible: Collectible): boolean => {
  // 既に収集済みのアイテムは判定しない
  if (collectible.collected) {
    return false;
  }
  
  return checkCollision(character, collectible);
};

/**
 * キャラクターが地面に着地しているかどうかを判定する関数
 * 
 * @param character - キャラクター情報
 * @param groundY - 地面のY座標
 * @returns 着地している場合はtrue、していない場合はfalse
 */
export const checkGroundCollision = (character: Character, groundY: number): boolean => {
  return character.y + character.height >= groundY;
};

/**
 * キャラクターが画面の境界を超えないように制限する関数
 * 
 * @param character - キャラクター情報
 * @param canvasWidth - 画面の幅
 * @param canvasHeight - 画面の高さ
 * @returns 制限されたキャラクターの位置
 */
export const constrainCharacterToBounds = (
  character: Character, 
  canvasWidth: number, 
  canvasHeight: number
): { x: number; y: number } => {
  const x = Math.max(0, Math.min(canvasWidth - character.width, character.x));
  const y = Math.max(0, Math.min(canvasHeight - character.height, character.y));
  
  return { x, y };
};

/**
 * 複数の障害物との衝突判定を一括で行う関数
 * 
 * @param character - キャラクター情報
 * @param obstacles - 障害物のリスト
 * @returns 衝突した障害物があればtrue、なければfalse
 */
export const checkMultipleObstacleCollisions = (character: Character, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obstacle => checkCharacterObstacleCollision(character, obstacle));
};

/**
 * 複数の収集アイテムとの衝突判定を一括で行う関数
 * 
 * @param character - キャラクター情報
 * @param collectibles - 収集アイテムのリスト
 * @returns 衝突した収集アイテムのリスト
 */
export const checkMultipleCollectibleCollisions = (character: Character, collectibles: Collectible[]): Collectible[] => {
  return collectibles.filter(collectible => checkCharacterCollectibleCollision(character, collectible));
};

/**
 * 円形の衝突判定を行う関数（将来的な使用を想定）
 * 
 * @param circle1 - 1つ目の円の情報 {x, y, radius}
 * @param circle2 - 2つ目の円の情報 {x, y, radius}
 * @returns 衝突している場合はtrue、していない場合はfalse
 * 
 * 初心者向け解説：
 * 円形の衝突判定は、2つの円の中心点の距離が、
 * 両方の円の半径の合計より小さい場合に「衝突」と判定します。
 */
export const checkCircleCollision = (
  circle1: { x: number; y: number; radius: number },
  circle2: { x: number; y: number; radius: number }
): boolean => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < circle1.radius + circle2.radius;
};