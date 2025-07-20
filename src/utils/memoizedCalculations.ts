/**
 * 最適化された計算処理を管理するファイル
 * 
 * このファイルは、計算コストの高い処理を効率化します。
 * 初心者向け解説：
 * - 重い計算処理を関数として分離することで、コードの可読性と保守性が向上
 * - ゲームの60FPS実行で重要なパフォーマンス最適化
 * - 通常の関数として提供し、呼び出し側でメモ化を制御
 */

import { GAME_CONFIG, ANIMATION, BUILDINGS, CLOUDS } from './constants';

/**
 * キャラクターアニメーション計算結果の型定義
 */
export interface CharacterAnimationCalculations {
  bounce: number;
  eyeHeight: number;
  hairOffset: number;
  armSwing: number;
  leftLegOffset: number;
  rightLegOffset: number;
}

/**
 * キャラクターアニメーション計算
 * 
 * @param animationFrame - アニメーションフレーム数
 * @param isJumping - ジャンプ中かどうか
 * @returns アニメーション計算結果
 */
export const calculateCharacterAnimation = (animationFrame: number, isJumping: boolean): CharacterAnimationCalculations => {
  // バウンス計算（走り中の上下動）
  const bounce = isJumping ? 0 : Math.sin(animationFrame * ANIMATION.BOUNCE_SPEED) * ANIMATION.BOUNCE_AMPLITUDE;
  
  // まばたき計算
  const eyeHeight = (animationFrame % ANIMATION.BLINK_INTERVAL) < ANIMATION.BLINK_DURATION ? 2 : 5;
  
  // 髪の揺れ計算
  const hairOffset = isJumping ? -2 : Math.sin(animationFrame * ANIMATION.HAIR_WAVE_SPEED) * ANIMATION.HAIR_WAVE_AMPLITUDE;
  
  // 腕の振り計算
  const armSwing = Math.sin(animationFrame * ANIMATION.ARM_SWING_SPEED) * ANIMATION.ARM_SWING_AMPLITUDE;
  
  // 足の動き計算
  const leftLegOffset = Math.sin(animationFrame * ANIMATION.LEG_SWING_SPEED) * ANIMATION.LEG_SWING_AMPLITUDE;
  const rightLegOffset = -Math.sin(animationFrame * ANIMATION.LEG_SWING_SPEED) * ANIMATION.LEG_SWING_AMPLITUDE;
  
  return {
    bounce,
    eyeHeight,
    hairOffset,
    armSwing,
    leftLegOffset,
    rightLegOffset,
  };
};

/**
 * 背景スクロール計算結果の型定義
 */
export interface BackgroundScrollCalculations {
  buildingOffset: number;
  windmillRotation: number;
  cloudPositions: Array<{ x: number; y: number }>;
  brickOffset: number;
  birdPositions: Array<{ x: number; y: number }>;
}

/**
 * 背景スクロール計算
 * 
 * @param score - 現在のスコア
 * @param gameSpeed - ゲーム速度
 * @returns 背景スクロール計算結果
 */
export const calculateBackgroundScroll = (score: number, gameSpeed: number): BackgroundScrollCalculations => {
  // 建物のオフセット計算
  const buildingOffset = (score * BUILDINGS.SCROLL_SPEED) % 1000;
  
  // 風車の回転角度計算
  const windmillRotation = (score * BUILDINGS.WINDMILL_ROTATION_SPEED) % (Math.PI * 2);
  
  // 雲の位置計算
  const cloudPositions = Array.from({ length: CLOUDS.COUNT }, (_, i) => ({
    x: (i * CLOUDS.SPACING + (score * CLOUDS.SCROLL_SPEED) % 1000) % 1000 - 100,
    y: CLOUDS.BASE_Y + i * CLOUDS.Y_VARIATION,
  }));
  
  // 地面のレンガパターンオフセット計算
  const brickOffset = (score * gameSpeed) % 60;
  
  // 遠景の鳥の位置計算
  const birdPositions = Array.from({ length: 3 }, (_, i) => ({
    x: (i * 250 + (score * 0.1) % GAME_CONFIG.CANVAS_WIDTH) % GAME_CONFIG.CANVAS_WIDTH,
    y: 80 + Math.sin((score + i * 100) * 0.01) * 20,
  }));
  
  return {
    buildingOffset,
    windmillRotation,
    cloudPositions,
    brickOffset,
    birdPositions,
  };
};

/**
 * ゲーム設定の派生値計算
 * 
 * @returns ゲーム設定の派生値
 */
export const calculateGameConfig = () => {
  return {
    // プレイヤーの中心位置
    playerCenterX: GAME_CONFIG.PLAYER_START_X + GAME_CONFIG.PLAYER_WIDTH / 2,
    playerCenterY: GAME_CONFIG.PLAYER_START_Y + GAME_CONFIG.PLAYER_HEIGHT / 2,
    
    // 画面の中心位置
    canvasCenterX: GAME_CONFIG.CANVAS_WIDTH / 2,
    canvasCenterY: GAME_CONFIG.CANVAS_HEIGHT / 2,
    
    // 地面の範囲
    groundTop: GAME_CONFIG.GROUND_Y,
    groundBottom: GAME_CONFIG.GROUND_Y + GAME_CONFIG.GROUND_HEIGHT,
    
    // 障害物の最大数（メモリ最適化用）
    maxObstacles: Math.ceil(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.OBSTACLE_MIN_DISTANCE) + 2,
    
    // 収集アイテムの最大数（メモリ最適化用）
    maxCollectibles: 10,
  };
};