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
  
  // キャラクターの色
  SKIN_COLOR: '#FDBCB4',
  HAIR_COLOR: '#FFD700',  // 金髪
  EYE_COLOR: '#4A90E2',   // 青い目
  SHIRT_COLOR: '#FF6B6B',  // スポーツウェア - レッド
  PANTS_COLOR: '#4ECDC4',  // スポーツウェア - ティール
  SHOES_COLOR: '#FFF',     // 白いスニーカー
  SHOE_ACCENT: '#FF6B6B',  // スニーカーのアクセント
  
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