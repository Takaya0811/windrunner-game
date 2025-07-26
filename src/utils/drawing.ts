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
  CLOUDS 
} from '../utils/constants';

// BackgroundScrollCalculations型の定義
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
  ctx.strokeStyle = COLORS.GROUND_LINE_COLOR;
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
  
  // テキスト描画のリセット
  ctx.textAlign = 'left';
};