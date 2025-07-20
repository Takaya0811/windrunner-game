/**
 * 描画処理を管理するファイル
 * 
 * このファイルは、ゲーム内の全ての描画処理を管理します。
 * 初心者向け解説：
 * - 「描画」とは、画面に絵を描く処理のこと
 * - 各要素（キャラクター、障害物、背景など）を描画する関数を分離
 * - 長い描画処理をメインファイルから分離することで、可読性が向上
 */

import { Character, Obstacle, Collectible } from '@/types/game';
import { GAME_CONFIG, COLORS, ANIMATION, BUILDINGS, CLOUDS } from '@/utils/constants';
import { CharacterAnimationCalculations, BackgroundScrollCalculations } from '@/utils/memoizedCalculations';

/**
 * キャラクター（プレイヤー）を描画する関数（最適化版）
 * @param ctx - 描画コンテキスト
 * @param char - キャラクターの情報
 * @param animationCalcs - 事前計算されたアニメーション値（オプション）
 */
export const drawCharacter = (
  ctx: CanvasRenderingContext2D, 
  char: Character, 
  animationCalcs?: CharacterAnimationCalculations
) => {
  // 事前計算された値を使用するか、従来の計算方法を使用
  const animations = animationCalcs || {
    bounce: char.isJumping ? 0 : Math.sin(char.animationFrame * ANIMATION.BOUNCE_SPEED) * ANIMATION.BOUNCE_AMPLITUDE,
    eyeHeight: (char.animationFrame % ANIMATION.BLINK_INTERVAL) < ANIMATION.BLINK_DURATION ? 2 : 5,
    hairOffset: char.isJumping ? -2 : Math.sin(char.animationFrame * ANIMATION.HAIR_WAVE_SPEED) * ANIMATION.HAIR_WAVE_AMPLITUDE,
    armSwing: Math.sin(char.animationFrame * ANIMATION.ARM_SWING_SPEED) * ANIMATION.ARM_SWING_AMPLITUDE,
    leftLegOffset: Math.sin(char.animationFrame * ANIMATION.LEG_SWING_SPEED) * ANIMATION.LEG_SWING_AMPLITUDE,
    rightLegOffset: -Math.sin(char.animationFrame * ANIMATION.LEG_SWING_SPEED) * ANIMATION.LEG_SWING_AMPLITUDE,
  };
  
  // 基本位置調整
  const baseX = char.x;
  const baseY = char.y + animations.bounce;
  
  // 体（メイン）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.fillRect(baseX, baseY, char.width, char.height);
  
  // 顔
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.fillRect(baseX + 5, baseY - 15, 30, 20);
  
  // 目（まばたき効果）
  ctx.fillStyle = COLORS.BLACK;
  ctx.fillRect(baseX + 10, baseY - 10, 4, animations.eyeHeight);
  ctx.fillRect(baseX + 21, baseY - 10, 4, animations.eyeHeight);
  
  // 目の輝き
  ctx.fillStyle = COLORS.WHITE;
  ctx.fillRect(baseX + 11, baseY - 9, 1, 1);
  ctx.fillRect(baseX + 22, baseY - 9, 1, 1);
  
  // 髪（風になびく効果）
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.fillRect(baseX + 3 + animations.hairOffset, baseY - 20, 34, 10);
  
  // 服（メイン）
  ctx.fillStyle = COLORS.SHIRT_COLOR;
  ctx.fillRect(baseX + 5, baseY + 15, 30, 25);
  
  // 服の装飾
  ctx.fillStyle = COLORS.WHITE;
  ctx.fillRect(baseX + 15, baseY + 20, 10, 3);
  ctx.fillRect(baseX + 15, baseY + 28, 10, 3);
  
  // 腕の動き（走りアニメーション）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  if (char.isJumping) {
    // ジャンプ中は腕を上に
    ctx.fillRect(baseX - 5, baseY + 10, 8, 20);
    ctx.fillRect(baseX + 37, baseY + 10, 8, 20);
  } else {
    // 走り中は腕を振る
    ctx.fillRect(baseX - 5, baseY + 15 + animations.armSwing, 8, 20);
    ctx.fillRect(baseX + 37, baseY + 15 - animations.armSwing, 8, 20);
  }
  
  // 足の動き（走りアニメーション）
  ctx.fillStyle = COLORS.PANTS_COLOR;
  if (char.isJumping) {
    // ジャンプ中は足を曲げる
    ctx.fillRect(baseX + 8, baseY + 45, 8, 15);
    ctx.fillRect(baseX + 24, baseY + 45, 8, 15);
  } else {
    // 走り中は足を交互に動かす
    const leftLegY = baseY + 40 + animations.leftLegOffset;
    const rightLegY = baseY + 40 + animations.rightLegOffset;
    ctx.fillRect(baseX + 8, leftLegY, 8, 20);
    ctx.fillRect(baseX + 24, rightLegY, 8, 20);
  }
  
  // 靴
  ctx.fillStyle = COLORS.SHOES_COLOR;
  const leftShoeY = char.isJumping ? baseY + 58 : baseY + 58 + animations.leftLegOffset;
  const rightShoeY = char.isJumping ? baseY + 58 : baseY + 58 + animations.rightLegOffset;
  ctx.fillRect(baseX + 6, leftShoeY, 12, 4);
  ctx.fillRect(baseX + 22, rightShoeY, 12, 4);
  
  // 影
  ctx.fillStyle = COLORS.SHADOW_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, 380, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // ジャンプ時のエフェクト
  if (char.isJumping && char.velocityY > 0) {
    // 着地時の煙エフェクト
    ctx.fillStyle = COLORS.SMOKE_COLOR;
    for (let i = 0; i < 5; i++) {
      const smokeX = baseX + 10 + Math.random() * 20;
      const smokeY = 375 + Math.random() * 10;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

/**
 * 障害物を描画する関数
 * @param ctx - 描画コンテキスト
 * @param obstacle - 障害物の情報
 */
export const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
  if (obstacle.type === 'cactus') {
    ctx.fillStyle = COLORS.CACTUS_COLOR;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // サボテンの刺
    ctx.strokeStyle = COLORS.CACTUS_SPIKE_COLOR;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x - 3, obstacle.y + i * 15 + 10);
      ctx.lineTo(obstacle.x + 3, obstacle.y + i * 15 + 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(obstacle.x + obstacle.width - 3, obstacle.y + i * 15 + 10);
      ctx.lineTo(obstacle.x + obstacle.width + 3, obstacle.y + i * 15 + 10);
      ctx.stroke();
    }
  } else {
    // 鳥
    ctx.fillStyle = COLORS.BIRD_BODY_COLOR;
    ctx.beginPath();
    ctx.ellipse(obstacle.x + 15, obstacle.y + 10, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 翼
    ctx.strokeStyle = COLORS.BIRD_WING_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + 5);
    ctx.lineTo(obstacle.x + 10, obstacle.y - 5);
    ctx.moveTo(obstacle.x + 30, obstacle.y + 5);
    ctx.lineTo(obstacle.x + 20, obstacle.y - 5);
    ctx.stroke();
  }
};

/**
 * 収集アイテムを描画する関数
 * @param ctx - 描画コンテキスト
 * @param collectible - 収集アイテムの情報
 */
export const drawCollectible = (ctx: CanvasRenderingContext2D, collectible: Collectible) => {
  if (!collectible.collected) {
    ctx.fillStyle = COLORS.COLLECTIBLE_COLOR;
    ctx.beginPath();
    ctx.arc(collectible.x + 10, collectible.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 星の形
    ctx.fillStyle = COLORS.COLLECTIBLE_STAR_COLOR;
    ctx.font = '16px Arial';
    ctx.fillText('★', collectible.x + 3, collectible.y + 16);
  }
};

/**
 * 背景を描画する関数（最適化版）
 * @param ctx - 描画コンテキスト
 * @param score - 現在のスコア（スクロール計算用）
 * @param gameSpeed - ゲーム速度（スクロール計算用）
 * @param backgroundCalcs - 事前計算された背景スクロール値（オプション）
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D, 
  score: number, 
  gameSpeed: number,
  backgroundCalcs?: BackgroundScrollCalculations
) => {
  // 事前計算された値を使用するか、従来の計算方法を使用
  const background = backgroundCalcs || {
    buildingOffset: (score * BUILDINGS.SCROLL_SPEED) % 1000,
    windmillRotation: (score * BUILDINGS.WINDMILL_ROTATION_SPEED) % (Math.PI * 2),
    cloudPositions: Array.from({ length: CLOUDS.COUNT }, (_, i) => ({
      x: (i * CLOUDS.SPACING + (score * CLOUDS.SCROLL_SPEED) % 1000) % 1000 - 100,
      y: CLOUDS.BASE_Y + i * CLOUDS.Y_VARIATION,
    })),
    brickOffset: (score * gameSpeed) % 60,
    birdPositions: Array.from({ length: 3 }, (_, i) => ({
      x: (i * 250 + (score * 0.1) % GAME_CONFIG.CANVAS_WIDTH) % GAME_CONFIG.CANVAS_WIDTH,
      y: 80 + Math.sin((score + i * 100) * 0.01) * 20,
    })),
  };
  // 青空のグラデーション
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
  skyGradient.addColorStop(0, '#87CEEB'); // 明るい青
  skyGradient.addColorStop(0.7, '#B0E0E6'); // 薄い青
  skyGradient.addColorStop(1, '#F0F8FF'); // 地平線付近は白っぽく
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, 300);
  
  // 遠景の山々
  ctx.fillStyle = '#9370DB';
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(150, 150);
  ctx.lineTo(300, 180);
  ctx.lineTo(450, 140);
  ctx.lineTo(600, 170);
  ctx.lineTo(800, 160);
  ctx.lineTo(800, 300);
  ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();
  
  // 中景のヨーロッパ風建物群
  // 建物1: 教会風
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(100 - background.buildingOffset, 220, 60, 80);
  // 教会の屋根
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(100 - background.buildingOffset, 220);
  ctx.lineTo(130 - background.buildingOffset, 190);
  ctx.lineTo(160 - background.buildingOffset, 220);
  ctx.closePath();
  ctx.fill();
  // 十字架
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(128 - background.buildingOffset, 185, 4, 10);
  ctx.fillRect(125 - background.buildingOffset, 188, 10, 4);
  
  // 建物2: 城壁風
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(200 - background.buildingOffset, 240, 80, 60);
  // 城壁の塔
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(210 - background.buildingOffset, 230, 15, 70);
  ctx.fillRect(255 - background.buildingOffset, 230, 15, 70);
  
  // 建物3: 住宅風
  ctx.fillStyle = '#CD853F';
  ctx.fillRect(320 - background.buildingOffset, 250, 50, 50);
  // 屋根
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.moveTo(320 - background.buildingOffset, 250);
  ctx.lineTo(345 - background.buildingOffset, 230);
  ctx.lineTo(370 - background.buildingOffset, 250);
  ctx.closePath();
  ctx.fill();
  
  // 建物4: 大聖堂風
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(450 - background.buildingOffset, 200, 70, 100);
  // 大聖堂の尖塔
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(485 - background.buildingOffset, 200);
  ctx.lineTo(485 - background.buildingOffset, 170);
  ctx.lineTo(490 - background.buildingOffset, 180);
  ctx.lineTo(495 - background.buildingOffset, 170);
  ctx.lineTo(495 - background.buildingOffset, 200);
  ctx.closePath();
  ctx.fill();
  
  // 建物5: 市場風
  ctx.fillStyle = '#F4A460';
  ctx.fillRect(600 - background.buildingOffset, 260, 60, 40);
  // 市場のテント
  ctx.fillStyle = '#DC143C';
  ctx.beginPath();
  ctx.moveTo(600 - background.buildingOffset, 260);
  ctx.lineTo(630 - background.buildingOffset, 245);
  ctx.lineTo(660 - background.buildingOffset, 260);
  ctx.closePath();
  ctx.fill();
  
  // 建物6: 風車小屋
  ctx.fillStyle = '#DDD';
  ctx.fillRect(750 - background.buildingOffset, 240, 30, 60);
  // 風車の羽根
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  const windmillCenterX = 765 - background.buildingOffset;
  const windmillCenterY = 250;
  for (let i = 0; i < 4; i++) {
    const angle = background.windmillRotation + (i * Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(windmillCenterX, windmillCenterY);
    ctx.lineTo(windmillCenterX + Math.cos(angle) * 20, windmillCenterY + Math.sin(angle) * 20);
    ctx.stroke();
  }
  
  // 雲（ふわふわした感じ）
  ctx.fillStyle = COLORS.WHITE;
  for (let i = 0; i < background.cloudPositions.length; i++) {
    const cloudX = background.cloudPositions[i].x;
    const cloudY = background.cloudPositions[i].y;
    
    // 雲の影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(cloudX + 2, cloudY + 2, 25, 0, Math.PI * 2);
    ctx.arc(cloudX + 22, cloudY + 2, 18, 0, Math.PI * 2);
    ctx.arc(cloudX + 42, cloudY + 2, 22, 0, Math.PI * 2);
    ctx.fill();
    
    // 雲本体
    ctx.fillStyle = COLORS.WHITE;
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY, 18, 0, Math.PI * 2);
    ctx.arc(cloudX + 40, cloudY, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // レンガ風の地面
  ctx.fillStyle = COLORS.GROUND_COLOR;
  ctx.fillRect(0, 300, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GROUND_HEIGHT);
  
  // レンガのパターン
  ctx.fillStyle = COLORS.GROUND_LINE_COLOR;
  ctx.lineWidth = 2;
  
  // 横の線
  for (let y = 320; y < 380; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
    ctx.stroke();
  }
  
  // 縦の線（レンガパターン）
  for (let row = 0; row < 3; row++) {
    const yPos = 320 + row * 20;
    const offset = (row % 2) * 30 + background.brickOffset;
    
    for (let x = -60 + offset; x < GAME_CONFIG.CANVAS_WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x, yPos + 20);
      ctx.stroke();
    }
  }
  
  // レンガの質感
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
    const y = 300 + Math.random() * GAME_CONFIG.GROUND_HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }
  
  // 地面の草や小石
  ctx.fillStyle = COLORS.GRASS_COLOR;
  for (let i = 0; i < 20; i++) {
    const x = (i * 40 + background.brickOffset) % GAME_CONFIG.CANVAS_WIDTH;
    const y = 375 + Math.random() * 5;
    ctx.fillRect(x, y, 2, 8);
  }
  
  // 小石
  ctx.fillStyle = COLORS.STONE_COLOR;
  for (let i = 0; i < 15; i++) {
    const x = (i * 53 + (background.brickOffset * 0.8)) % GAME_CONFIG.CANVAS_WIDTH;
    const y = 370 + Math.random() * 10;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 遠景の鳥
  ctx.fillStyle = COLORS.BLACK;
  for (let i = 0; i < background.birdPositions.length; i++) {
    const birdX = background.birdPositions[i].x;
    const birdY = background.birdPositions[i].y;
    
    // 鳥のシルエット
    ctx.beginPath();
    ctx.arc(birdX, birdY, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // 翼
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(birdX - 3, birdY);
    ctx.lineTo(birdX - 1, birdY - 2);
    ctx.lineTo(birdX + 1, birdY);
    ctx.lineTo(birdX + 3, birdY - 2);
    ctx.stroke();
  }
};