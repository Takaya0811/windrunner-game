/**
 * 描画処理を管理するファイル
 * 
 * このファイルは、ゲーム内の全ての描画処理を管理します。
 * 初心者向け解説：
 * - 「描画」とは、画面に絵を描く処理のこと
 * - 各要素（キャラクター、障害物、背景など）を描画する関数を分離
 * - 長い描画処理をメインファイルから分離することで、可読性が向上
 */
// drawing.ts - TypeScriptエラー修正版

import { 
  Character, 
  Obstacle, 
  Collectible 
} from '../types/game';

import { 
  COLORS, 
  GAME_CONFIG, 
  BUILDINGS, 
  CLOUDS,
  PARALLAX,
  GROUND_LAYERS
} from '../utils/constants';

// パララックス背景の計算値型定義
interface ParallaxScrollCalculations {
  farBackground: number;    // 遠景のオフセット
  midBackground: number;    // 中景のオフセット
  nearBackground: number;   // 近景のオフセット
  foreground: number;       // 前景のオフセット
  windmillRotation: number; // 風車の回転角度
}

// 従来との互換性のための型定義（廃止予定）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BackgroundScrollCalculations {
  buildingOffset: number;
  windmillRotation: number;
  cloudPositions: Array<{
    x: number;
    y: number;
  }>;
  brickOffset: number;
  birdPositions: Array<{
    x: number;
    y: number;
  }>;
}

// アニメーション計算用の型
interface CharacterAnimations {
  eyeHeight: number;
  hairOffset: number;
  armSwing: number;
  leftLegOffset: number;
  rightLegOffset: number;
  bodyBounce: number;      // 体の上下運動
  headTilt: number;        // 頭の傾き
  breathingOffset: number; // 呼吸による体の動き
}

/**
 * キャラクターのアニメーション値を計算（強化版）
 */
const calculateAnimations = (gameSpeed: number, isRunning: boolean): CharacterAnimations => {
  const time = Date.now() * 0.01;
  const speedMultiplier = Math.max(1, gameSpeed * 0.5); // スピードに応じてアニメーション速度を調整
  
  return {
    // まばたき（より自然に）
    eyeHeight: Math.random() > 0.98 ? 1 : (Math.random() > 0.96 ? 4 : 8),
    
    // 髪の揺れ（風とスピードに応じて）
    hairOffset: Math.sin(time * 0.15 * speedMultiplier) * (2 + gameSpeed * 0.5),
    
    // 腕の振り（より大きく、自然に）
    armSwing: isRunning ? 
      Math.sin(time * 0.5 * speedMultiplier) * (4 + gameSpeed * 0.8) : 
      Math.sin(time * 0.1) * 0.5, // 静止時も微細な動き
    
    // 左足の動き（より動的に）
    leftLegOffset: isRunning ? 
      Math.sin(time * 0.6 * speedMultiplier) * (3 + gameSpeed * 0.6) : 
      0,
    
    // 右足の動き（位相をずらしてより自然に）
    rightLegOffset: isRunning ? 
      Math.sin(time * 0.6 * speedMultiplier + Math.PI) * (3 + gameSpeed * 0.6) : 
      0,
    
    // 体の上下運動（走る時のバウンス）
    bodyBounce: isRunning ? 
      Math.sin(time * 1.2 * speedMultiplier) * (1.5 + gameSpeed * 0.3) : 
      Math.sin(time * 0.08) * 0.3, // 静止時の呼吸による微細な動き
    
    // 頭の傾き（走る時の動的な動き）
    headTilt: isRunning ? 
      Math.sin(time * 0.4 * speedMultiplier) * (0.05 + gameSpeed * 0.01) : 
      0,
    
    // 呼吸による体の動き
    breathingOffset: Math.sin(time * 0.12) * 0.8,
  };
};

/**
 * キャラクターを描画する関数（アニメ風デザイン）
 * @param ctx - 描画コンテキスト
 * @param char - キャラクターの情報
 * @param gameSpeed - ゲーム速度
 */
export const drawCharacter = (
  ctx: CanvasRenderingContext2D, 
  char: Character, 
  gameSpeed: number
) => {
  const baseX = char.x;
  const baseY = char.y;
  const isRunning = gameSpeed > 0 && !char.isJumping;
  
  // アニメーション値を計算
  const animations = calculateAnimations(gameSpeed, isRunning);
  
  // アニメーションによる位置調整
  const bodyY = baseY + animations.bodyBounce + animations.breathingOffset;
  const headY = baseY - 15 + animations.bodyBounce;
  const headTilt = animations.headTilt;
  
  // 体のベース（楕円形で自然な体型）
  ctx.fillStyle = COLORS.SHIRT_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY + 10, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 首
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY - 8, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 顔の輪郭（より大きく、アニメ風に）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, headY, 15, 18, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 髪の後ろ部分（金髪）
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset, headY, 17, 20, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 前髪（風になびく効果）
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset * 0.5, headY - 10, 12, 8, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // サイドの髪
  ctx.beginPath();
  ctx.ellipse(baseX + 8 + animations.hairOffset, headY - 3, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(baseX + 32 + animations.hairOffset, headY - 3, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 目の形（アニメ風の大きな目）
  const eyeY = headY - 3;
  ctx.fillStyle = COLORS.WHITE;
  if (animations.eyeHeight > 2) {
    // 左目
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 4, animations.eyeHeight * 0.6, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // 右目
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 4, animations.eyeHeight * 0.6, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 瞳（青い目）
    ctx.fillStyle = COLORS.EYE_COLOR;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 3, animations.eyeHeight * 0.4, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 3, animations.eyeHeight * 0.4, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 瞳孔
    ctx.fillStyle = COLORS.BLACK;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 1.5, animations.eyeHeight * 0.2, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 1.5, animations.eyeHeight * 0.2, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 目の輝き
    ctx.fillStyle = COLORS.WHITE;
    ctx.beginPath();
    ctx.arc(baseX + 15, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 27, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // まばたき時は線だけ
    ctx.strokeStyle = COLORS.BLACK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(baseX + 14, eyeY, 4, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(baseX + 26, eyeY, 4, 0, Math.PI);
    ctx.stroke();
  }
  
  // 眉毛
  ctx.strokeStyle = COLORS.HAIR_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(baseX + 10, headY - 9);
  ctx.lineTo(baseX + 18, headY - 10);
  ctx.moveTo(baseX + 22, headY - 10);
  ctx.lineTo(baseX + 30, headY - 9);
  ctx.stroke();
  
  // 鼻（小さく、アニメ風）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(baseX + 20, headY + 3, 1, 0, Math.PI * 2);
  ctx.fill();
  
  // 口（小さく、可愛らしく）
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(baseX + 20, headY + 7, 2, 0, Math.PI);
  ctx.stroke();
  
  // スポーツウェアのシャツ（より詳細に）
  ctx.fillStyle = COLORS.SHIRT_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY + 10, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // シャツの襟
  ctx.fillStyle = COLORS.WHITE;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // シャツのストライプ
  ctx.fillStyle = COLORS.WHITE;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(baseX + 12, bodyY + 8 + i * 6, 16, 2);
  }
  
  // 腕（アニメ風の滑らかな形）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  if (char.isJumping) {
    // ジャンプ中は腕を上に
    ctx.beginPath();
    ctx.ellipse(baseX + 2, bodyY + 12, 4, 12, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 38, bodyY + 12, 4, 12, -Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 走り中は腕を振る（より大きな動き）
    const leftArmY = bodyY + 15 + animations.armSwing + animations.bodyBounce * 0.3;
    const rightArmY = bodyY + 15 - animations.armSwing + animations.bodyBounce * 0.3;
    ctx.beginPath();
    ctx.ellipse(baseX + 2, leftArmY, 4, 12, animations.armSwing * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 38, rightArmY, 4, 12, -animations.armSwing * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 手（グローブ風）
  ctx.fillStyle = COLORS.WHITE;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.arc(baseX + 2, bodyY + 22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 38, bodyY + 22, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const leftHandY = bodyY + 25 + animations.armSwing + animations.bodyBounce * 0.3;
    const rightHandY = bodyY + 25 - animations.armSwing + animations.bodyBounce * 0.3;
    ctx.beginPath();
    ctx.arc(baseX + 2, leftHandY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 38, rightHandY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // スポーツパンツ（ショートパンツ風）
  ctx.fillStyle = COLORS.PANTS_COLOR;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 40, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 40, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 走り中は足を交互に動かす（より動的に）
    const leftLegY = bodyY + 40 + animations.leftLegOffset + animations.bodyBounce * 0.2;
    const rightLegY = bodyY + 40 + animations.rightLegOffset + animations.bodyBounce * 0.2;
    ctx.beginPath();
    ctx.ellipse(baseX + 12, leftLegY, 6, 12, animations.leftLegOffset * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, rightLegY, 6, 12, animations.rightLegOffset * 0.01, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 足（素肌部分）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 52, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 52, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const leftLegY = bodyY + 52 + animations.leftLegOffset + animations.bodyBounce * 0.2;
    const rightLegY = bodyY + 52 + animations.rightLegOffset + animations.bodyBounce * 0.2;
    ctx.beginPath();
    ctx.ellipse(baseX + 12, leftLegY, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, rightLegY, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // スニーカー（白いスポーツシューズ）
  ctx.fillStyle = COLORS.SHOES_COLOR;
  const leftShoeY = char.isJumping ? 
    bodyY + 58 : 
    bodyY + 58 + animations.leftLegOffset + animations.bodyBounce * 0.2;
  const rightShoeY = char.isJumping ? 
    bodyY + 58 : 
    bodyY + 58 + animations.rightLegOffset + animations.bodyBounce * 0.2;
  
  ctx.beginPath();
  ctx.ellipse(baseX + 12, leftShoeY, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(baseX + 28, rightShoeY, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // スニーカーのアクセント
  ctx.fillStyle = COLORS.SHOE_ACCENT;
  ctx.beginPath();
  ctx.ellipse(baseX + 12, leftShoeY - 1, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(baseX + 28, rightShoeY - 1, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 影（より自然に）
  ctx.fillStyle = COLORS.SHADOW_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, 380, 22, 6, 0, 0, Math.PI * 2);
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
  
  // 走り時のスピードエフェクト
  if (isRunning && gameSpeed > 3) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 3; i++) {
      const effectX = baseX - 10 - i * 5;
      const effectY = baseY + 10 + Math.random() * 20;
      ctx.beginPath();
      ctx.ellipse(effectX, effectY, 3, 8, 0, 0, Math.PI * 2);
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
    // 星の背景（光る効果）
    ctx.fillStyle = COLORS.COLLECTIBLE_COLOR;
    ctx.beginPath();
    ctx.arc(collectible.x + 10, collectible.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 星の形
    ctx.fillStyle = COLORS.COLLECTIBLE_STAR_COLOR;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', collectible.x + 10, collectible.y + 16);
  }
};

/**
 * パララックススクロール値を計算する関数（最適化済み）
 * @param score - 現在のスコア
 * @param gameSpeed - ゲーム速度
 * @returns パララックススクロール計算値
 */
const calculateParallaxOffsets = (score: number, gameSpeed: number): ParallaxScrollCalculations => {
  // 基本オフセットを計算（スムースなスクロール）
  const baseOffset = score * gameSpeed * 0.5; // スクロール係数を調整
  
  return {
    farBackground: (baseOffset * PARALLAX.FAR_BACKGROUND) % PARALLAX.REPEAT_DISTANCE,
    midBackground: (baseOffset * PARALLAX.MID_BACKGROUND) % PARALLAX.REPEAT_DISTANCE,
    nearBackground: (baseOffset * PARALLAX.NEAR_BACKGROUND) % PARALLAX.REPEAT_DISTANCE,
    foreground: (baseOffset * PARALLAX.FOREGROUND) % PARALLAX.REPEAT_DISTANCE,
    windmillRotation: (score * BUILDINGS.WINDMILL_ROTATION_SPEED * 0.3) % (Math.PI * 2), // 風車を遅く
  };
};

/**
 * 遠景レイヤーを描画（空、山、雲）
 * @param ctx - 描画コンテキスト
 * @param offset - パララックスオフセット
 */
const drawFarBackground = (ctx: CanvasRenderingContext2D, offset: number) => {
  // 空のグラデーション
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
  skyGradient.addColorStop(0, '#87CEEB'); // 明るい青
  skyGradient.addColorStop(0.7, '#B0E0E6'); // 薄い青
  skyGradient.addColorStop(1, '#F0F8FF'); // 地平線付近は白っぽく
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, 300);
  
  // 遠景の山々（非常にゆっくり動く）
  ctx.fillStyle = '#9370DB';
  const mountainOffset = offset * 0.5; // さらに遅く
  
  // 山の形状を複数描画して継続感を作る
  for (let i = -1; i <= 1; i++) {
    const baseX = i * GAME_CONFIG.CANVAS_WIDTH - mountainOffset;
    ctx.beginPath();
    ctx.moveTo(baseX, 200);
    ctx.lineTo(baseX + 150, 150);
    ctx.lineTo(baseX + 300, 180);
    ctx.lineTo(baseX + 450, 140);
    ctx.lineTo(baseX + 600, 170);
    ctx.lineTo(baseX + 800, 160);
    ctx.lineTo(baseX + 800, 300);
    ctx.lineTo(baseX, 300);
    ctx.closePath();
    ctx.fill();
  }
  
  // 雲（ゆっくり動く）
  ctx.fillStyle = COLORS.WHITE;
  const cloudOffset = offset * 0.8;
  
  for (let i = 0; i < CLOUDS.COUNT * 2; i++) {
    const cloudX = (i * CLOUDS.SPACING - cloudOffset) % (PARALLAX.REPEAT_DISTANCE) - 100;
    const cloudY = CLOUDS.BASE_Y + (i % CLOUDS.COUNT) * CLOUDS.Y_VARIATION;
    
    if (cloudX > -150 && cloudX < GAME_CONFIG.CANVAS_WIDTH + 50) {
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
  }
};

/**
 * 中景レイヤーを描画（建物、樹木）
 * @param ctx - 描画コンテキスト
 * @param offset - パララックスオフセット
 * @param windmillRotation - 風車の回転角度
 */
const drawMidBackground = (ctx: CanvasRenderingContext2D, offset: number, windmillRotation: number) => {
  // 建物群（中程度の速度で動く）
  const buildings = [
    { x: 100, y: 220, width: 60, height: 80, type: 'church' },
    { x: 200, y: 240, width: 80, height: 60, type: 'castle' },
    { x: 320, y: 250, width: 50, height: 50, type: 'house' },
    { x: 450, y: 200, width: 70, height: 100, type: 'cathedral' },
    { x: 600, y: 260, width: 60, height: 40, type: 'market' },
    { x: 750, y: 240, width: 30, height: 60, type: 'windmill' },
  ];
  
  // 建物を繰り返し描画
  for (let repeat = -1; repeat <= 2; repeat++) {
    const repeatOffset = repeat * 800;
    
    buildings.forEach(building => {
      const buildingX = building.x + repeatOffset - offset;
      
      if (buildingX > -100 && buildingX < GAME_CONFIG.CANVAS_WIDTH + 100) {
        switch (building.type) {
          case 'church':
            // 教会
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(buildingX, building.y, building.width, building.height);
            // 屋根
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(buildingX, building.y);
            ctx.lineTo(buildingX + building.width/2, building.y - 30);
            ctx.lineTo(buildingX + building.width, building.y);
            ctx.closePath();
            ctx.fill();
            // 十字架
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(buildingX + building.width/2 - 2, building.y - 35, 4, 10);
            ctx.fillRect(buildingX + building.width/2 - 5, building.y - 32, 10, 4);
            break;
            
          case 'windmill':
            // 風車小屋
            ctx.fillStyle = '#DDD';
            ctx.fillRect(buildingX, building.y, building.width, building.height);
            // 風車の羽根（回転）
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            const centerX = buildingX + building.width/2;
            const centerY = building.y + 10;
            for (let i = 0; i < 4; i++) {
              const angle = windmillRotation + (i * Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(centerX + Math.cos(angle) * 20, centerY + Math.sin(angle) * 20);
              ctx.stroke();
            }
            break;
            
          default:
            // その他の建物
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(buildingX, building.y, building.width, building.height);
        }
      }
    });
  }
};

/**
 * 近景レイヤーを描画（草、石、小オブジェクト）
 * @param ctx - 描画コンテキスト
 * @param offset - パララックスオフセット
 */
const drawNearBackground = (ctx: CanvasRenderingContext2D, offset: number) => {
  // 草（比較的速く動く）
  ctx.fillStyle = COLORS.GRASS_COLOR;
  for (let i = 0; i < GROUND_LAYERS.GRASS_COUNT; i++) {
    const grassX = (i * 40 - offset) % PARALLAX.REPEAT_DISTANCE;
    const grassY = 375 + Math.sin(i * 0.5) * 3;
    
    if (grassX > -10 && grassX < GAME_CONFIG.CANVAS_WIDTH + 10) {
      ctx.fillRect(grassX, grassY, 2, GROUND_LAYERS.GRASS_HEIGHT);
      // 追加の草の葉
      ctx.fillRect(grassX - 1, grassY + 2, 1, 4);
      ctx.fillRect(grassX + 2, grassY + 1, 1, 5);
    }
  }
  
  // 小石
  ctx.fillStyle = COLORS.STONE_COLOR;
  for (let i = 0; i < 20; i++) {
    const stoneX = (i * 53 - offset * 0.8) % PARALLAX.REPEAT_DISTANCE;
    const stoneY = 370 + Math.sin(i * 0.7) * 8;
    
    if (stoneX > -5 && stoneX < GAME_CONFIG.CANVAS_WIDTH + 5) {
      ctx.beginPath();
      ctx.arc(stoneX, stoneY, 2 + Math.sin(i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 小さな花
  for (let i = 0; i < 15; i++) {
    const flowerX = (i * 67 - offset * 0.9) % PARALLAX.REPEAT_DISTANCE;
    const flowerY = 372 + Math.sin(i * 0.3) * 5;
    
    if (flowerX > -5 && flowerX < GAME_CONFIG.CANVAS_WIDTH + 5) {
      // 花びら
      ctx.fillStyle = ['#FF69B4', '#FFB6C1', '#FFF8DC'][i % 3];
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 茎
      ctx.fillStyle = '#228B22';
      ctx.fillRect(flowerX - 0.5, flowerY, 1, 6);
    }
  }
};

/**
 * 前景レイヤーを描画（地面、道路）
 * @param ctx - 描画コンテキスト
 * @param offset - パララックスオフセット
 */
const drawForeground = (ctx: CanvasRenderingContext2D, offset: number) => {
  // 道路基盤
  ctx.fillStyle = GROUND_LAYERS.ROAD_COLOR;
  ctx.fillRect(0, GROUND_LAYERS.ROAD_Y, GAME_CONFIG.CANVAS_WIDTH, GROUND_LAYERS.ROAD_HEIGHT);
  
  // レンガのパターン（最も速く動く）
  ctx.strokeStyle = COLORS.GROUND_LINE_COLOR;
  ctx.lineWidth = 2;
  
  // 横の線
  for (let y = GROUND_LAYERS.ROAD_Y + 20; y < GROUND_LAYERS.ROAD_Y + GROUND_LAYERS.ROAD_HEIGHT; y += GROUND_LAYERS.BRICK_HEIGHT) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
    ctx.stroke();
  }
  
  // 縦の線（レンガパターン）
  const brickRows = Math.floor(GROUND_LAYERS.ROAD_HEIGHT / GROUND_LAYERS.BRICK_HEIGHT);
  for (let row = 0; row < brickRows; row++) {
    const yPos = GROUND_LAYERS.ROAD_Y + 20 + row * GROUND_LAYERS.BRICK_HEIGHT;
    const brickOffset = (row % 2) * (GROUND_LAYERS.BRICK_WIDTH / 2) + offset;
    
    for (let x = -GROUND_LAYERS.BRICK_WIDTH + (brickOffset % GROUND_LAYERS.BRICK_WIDTH); x < GAME_CONFIG.CANVAS_WIDTH; x += GROUND_LAYERS.BRICK_WIDTH) {
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x, yPos + GROUND_LAYERS.BRICK_HEIGHT);
      ctx.stroke();
    }
  }
  
  // レンガの質感
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  for (let i = 0; i < 80; i++) {
    const textureX = (i * 13 - offset * 1.2) % GAME_CONFIG.CANVAS_WIDTH;
    const textureY = GROUND_LAYERS.ROAD_Y + Math.random() * GROUND_LAYERS.ROAD_HEIGHT;
    ctx.fillRect(textureX, textureY, 2, 2);
  }
  
  // 道路の中央線
  ctx.fillStyle = '#FFFF00';
  const centerY = GROUND_LAYERS.ROAD_Y + GROUND_LAYERS.ROAD_HEIGHT / 2;
  for (let x = (-offset * 1.5) % 60; x < GAME_CONFIG.CANVAS_WIDTH; x += 30) {
    ctx.fillRect(x, centerY - 1, 15, 2);
  }
};

/**
 * 背景を描画する関数（パララックス対応版）
 * @param ctx - 描画コンテキスト
 * @param score - 現在のスコア（スクロール計算用）
 * @param gameSpeed - ゲーム速度（スクロール計算用）
 * 
 * 注意: 第4引数backgroundCalcsは旧式互換性のために残していますが、新しいパララックス実装では使用されません
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D, 
  score: number, 
  gameSpeed: number
) => {
  // パララックススクロール値を計算
  const parallax = calculateParallaxOffsets(score, gameSpeed);
  
  // 各層を順番に描画（奥から手前へ）
  drawFarBackground(ctx, parallax.farBackground);
  drawMidBackground(ctx, parallax.midBackground, parallax.windmillRotation);
  drawNearBackground(ctx, parallax.nearBackground);
  drawForeground(ctx, parallax.foreground);
  
  // テキスト描画のリセット
  ctx.textAlign = 'left';
};

