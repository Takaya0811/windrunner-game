/**
 * ゲームで使用する定数ファイル
 * 
 * このファイルは、ゲーム全体で使用する設定値を一箇所で管理します。
 * 初心者向け解説：
 * - 「定数」とは、プログラム中で変更されない値のこと
 * - 例：ゲームの速度、キャラクターのサイズなど
 * - 一箇所で管理することで、設定変更が簡単になる
 */

// ゲームの基本設定
export const GAME_CONFIG = {
  // 描画領域のサイズ
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  
  // 物理演算の設定
  GRAVITY: 0.8,           // 重力の強さ
  JUMP_FORCE: -15,        // ジャンプ力（負の値で上向き）
  
  // キャラクターの設定
  PLAYER_SPEED: 3,        // プレイヤーの移動速度
  PLAYER_WIDTH: 40,       // プレイヤーの幅
  PLAYER_HEIGHT: 60,      // プレイヤーの高さ
  PLAYER_START_X: 100,    // プレイヤーの開始X位置
  PLAYER_START_Y: 300,    // プレイヤーの開始Y位置
  
  // ゲームの設定
  INITIAL_GAME_SPEED: 2,  // ゲーム開始時の速度
  MAX_GAME_SPEED: 5,      // ゲームの最大速度
  SPEED_INCREASE: 0.002,  // 速度の増加率
  
  // 障害物の設定
  OBSTACLE_MIN_DISTANCE: 280,  // 障害物間の最小距離
  OBSTACLE_SPAWN_RATE: 0.012,  // 障害物の生成確率
  CACTUS_SPAWN_RATE: 0.6,      // サボテンの生成確率（残りは鳥）
  
  // サボテンの設定
  CACTUS_WIDTH: 20,
  CACTUS_HEIGHT: 50,
  CACTUS_Y: 330,
  
  // 鳥の設定
  BIRD_WIDTH: 30,
  BIRD_HEIGHT: 20,
  BIRD_Y: 250,
  
  // 収集アイテムの設定
  COLLECTIBLE_SPAWN_RATE: 0.008,  // アイテムの生成確率
  COLLECTIBLE_WIDTH: 20,
  COLLECTIBLE_HEIGHT: 20,
  COLLECTIBLE_SCORE: 50,          // アイテム収集時のスコア
  
  // 地面の設定
  GROUND_Y: 300,          // 地面のY位置
  GROUND_HEIGHT: 80,      // 地面の高さ
};

// 色の設定
export const COLORS = {
  // 空と背景
  SKY_TOP: '#87CEEB',
  SKY_MIDDLE: '#B0E0E6',
  SKY_BOTTOM: '#F0F8FF',
  
  // キャラクターの色（自然な肌色パレット）
  SKIN_COLOR: '#FDBCB4',        // 自然なピンクベージュ肌色
  SKIN_SHADOW: '#E8A298',       // 肌の影
  SKIN_HIGHLIGHT: '#FFF0F0',    // 肌のハイライト
  
  HAIR_COLOR: '#F4D03F',        // 洗練された金髪
  HAIR_SHADOW: '#D4AC0D',       // 髪の影
  HAIR_HIGHLIGHT: '#FCF3CF',    // 髪のハイライト
  
  EYE_COLOR: '#3498DB',         // 深みのある青い目
  EYE_HIGHLIGHT: '#85C1E9',     // 目のハイライト
  
  SHIRT_COLOR: '#E74C3C',       // 洗練されたスポーツレッド
  SHIRT_SHADOW: '#C0392B',      // シャツの影
  SHIRT_HIGHLIGHT: '#F1948A',   // シャツのハイライト
  
  PANTS_COLOR: '#48C9B0',       // モダンなティール
  PANTS_SHADOW: '#17A2B8',      // パンツの影
  PANTS_HIGHLIGHT: '#7DCEA0',   // パンツのハイライト
  
  SHOES_COLOR: '#F8F9FA',       // 純白スニーカー
  SHOE_ACCENT: '#E74C3C',       // スニーカーアクセント
  SHOE_SHADOW: '#DEE2E6',       // 靴の影
  SHOE_SOLE: '#343A40',         // 靴底
  
  // 障害物の色
  CACTUS_COLOR: '#228B22',
  CACTUS_SPIKE_COLOR: '#006400',
  BIRD_BODY_COLOR: '#8B4513',
  BIRD_WING_COLOR: '#654321',
  
  // アイテムの色
  COLLECTIBLE_COLOR: '#FFD700',
  COLLECTIBLE_STAR_COLOR: '#FFF',
  
  // 地面の色
  GROUND_COLOR: '#B87333',
  GROUND_LINE_COLOR: '#8B4513',
  GRASS_COLOR: '#228B22',
  STONE_COLOR: '#696969',
  
  // その他
  SHADOW_COLOR: 'rgba(0, 0, 0, 0.3)',
  SMOKE_COLOR: 'rgba(200, 200, 200, 0.5)',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
};

// アニメーション設定
export const ANIMATION = {
  RUN_CYCLE_FRAMES: 8,      // 走りアニメーションのフレーム数
  RUN_CYCLE_STEPS: 4,       // 走りアニメーションのステップ数
  BOUNCE_SPEED: 0.3,        // バウンスアニメーションの速度
  BOUNCE_AMPLITUDE: 1.5,    // バウンスアニメーションの振幅
  ARM_SWING_SPEED: 0.4,     // 腕振りアニメーションの速度
  ARM_SWING_AMPLITUDE: 3,   // 腕振りアニメーションの振幅
  LEG_SWING_SPEED: 0.4,     // 足振りアニメーションの速度
  LEG_SWING_AMPLITUDE: 2,   // 足振りアニメーションの振幅
  BLINK_INTERVAL: 120,      // まばたきの間隔（フレーム）
  BLINK_DURATION: 5,        // まばたきの持続時間（フレーム）
  HAIR_WAVE_SPEED: 0.1,     // 髪の揺れの速度
  HAIR_WAVE_AMPLITUDE: 1,   // 髪の揺れの振幅
};

// パララックス効果の設定
export const PARALLAX = {
  // 各層のスクロール速度倍率（Temple Runスタイル - 最適化済み）
  FAR_BACKGROUND: 0.08,     // 遠景（空、山、雲）- より遅く
  MID_BACKGROUND: 0.25,     // 中景（建物、樹木）- やや遅く
  NEAR_BACKGROUND: 0.6,     // 近景（草、石、小オブジェクト）- 適度
  FOREGROUND: 1.0,          // 前景（地面、道路）- 基準速度
  
  // 繰り返し距離
  REPEAT_DISTANCE: 1600,    // 背景要素の繰り返し距離
};

// 建物の設定（背景用）
export const BUILDINGS = {
  SCROLL_SPEED: 0.3,        // 建物のスクロール速度
  WINDMILL_ROTATION_SPEED: 0.1,  // 風車の回転速度
};

// 雲の設定
export const CLOUDS = {
  COUNT: 4,                 // 雲の数
  SPACING: 200,             // 雲の間隔
  SCROLL_SPEED: 0.2,        // 雲のスクロール速度
  BASE_Y: 50,               // 雲の基本Y位置
  Y_VARIATION: 20,          // 雲のY位置のばらつき
};

// 地面レイヤーの設定
export const GROUND_LAYERS = {
  // 道路（最前景）
  ROAD_Y: 300,              // 道路の開始Y位置
  ROAD_HEIGHT: 100,         // 道路の高さ
  ROAD_COLOR: '#8B7355',    // 道路の基本色
  
  // レンガパターン
  BRICK_WIDTH: 60,          // レンガの幅
  BRICK_HEIGHT: 20,         // レンガの高さ
  
  // 草地（近景）
  GRASS_COUNT: 30,          // 草の数
  GRASS_HEIGHT: 8,          // 草の高さ
};