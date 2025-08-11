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
  Collectible,
  WeatherType
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
 * キャラクターのアニメーション値を計算（修正版 - 自然な動き）
 */
const calculateAnimations = (gameSpeed: number, isRunning: boolean): CharacterAnimations => {
  const time = Date.now() * 0.01;
  const runSpeed = Math.max(1, gameSpeed * 0.3); // より控えめな速度調整
  
  // シンプルで自然なイージング（将来用）
  // const smoothStep = (t: number) => t * t * (3 - 2 * t);
  
  return {
    // まばたき（シンプルに）
    eyeHeight: Math.random() > 0.98 ? (Math.random() > 0.7 ? 1 : 2) : 8,
    
    // 髪の揺れ（控えめに）
    hairOffset: isRunning ? 
      Math.sin(time * 0.15 * runSpeed) * (1.5 + gameSpeed * 0.2) :
      Math.sin(time * 0.08) * 0.8,
    
    // 腕の振り（自然な前後振り）
    armSwing: isRunning ? 
      Math.sin(time * 0.35 * runSpeed) * (1.8 + gameSpeed * 0.2) : 
      Math.sin(time * 0.08) * 0.2,
    
    // 左足の動き（自然な歩行サイクル）
    leftLegOffset: isRunning ? 
      Math.sin(time * 0.35 * runSpeed) * (1.5 + gameSpeed * 0.15) : 
      0,
    
    // 右足の動き（左足と逆位相、自然な歩行）
    rightLegOffset: isRunning ? 
      Math.sin(time * 0.35 * runSpeed + Math.PI) * (1.5 + gameSpeed * 0.15) : 
      0,
    
    // 体の上下運動（控えめに）
    bodyBounce: isRunning ? 
      Math.abs(Math.sin(time * 0.8 * runSpeed)) * (1 + gameSpeed * 0.1) : 
      Math.sin(time * 0.1) * 0.3,
    
    // 頭の傾き（微細に）
    headTilt: isRunning ? 
      Math.sin(time * 0.3 * runSpeed) * 0.04 : 
      Math.sin(time * 0.05) * 0.01,
    
    // 呼吸による体の動き（穏やかに）
    breathingOffset: Math.sin(time * 0.12) * 0.4 + Math.sin(time * 0.08) * 0.2,
  };
};

/**
 * キャラクターを描画する関数（モダンデザイン）
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
  
  // アニメーションによる位置調整（修正版）
  const bodyY = baseY + animations.breathingOffset;
  const headY = baseY - 20 + animations.bodyBounce * 0.3; // 頭部の独立した動き
  const headTilt = animations.headTilt;
  
  // 光源設定（右上から照らす - 将来の機能拡張用）
  // const lightAngle = Math.PI / 4; // 45度
  
  // 体のベース（影から描画）
  // 体の影
  ctx.fillStyle = COLORS.SHIRT_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + 1, bodyY + 10 + 1, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 体のメイン
  ctx.fillStyle = COLORS.SHIRT_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY + 10, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 体のハイライト
  ctx.fillStyle = COLORS.SHIRT_HIGHLIGHT;
  ctx.beginPath();
  ctx.ellipse(baseX + 16, bodyY + 6, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 首（影付き）
  // 首の影
  ctx.fillStyle = COLORS.SKIN_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + 0.5, bodyY - 8 + 0.5, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 首のメイン
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, bodyY - 8, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 髪の後ろ部分（影から描画）
  // 髪の影
  ctx.fillStyle = COLORS.HAIR_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset + 1, headY + 1, 17, 20, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 髪のメイン
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset, headY, 17, 20, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 髪のハイライト
  ctx.fillStyle = COLORS.HAIR_HIGHLIGHT;
  ctx.beginPath();
  ctx.ellipse(baseX + 16 + animations.hairOffset * 0.7, headY - 3, 8, 10, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 顔の輪郭（影付き）
  // 顔の影
  ctx.fillStyle = COLORS.SKIN_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + 0.5, headY + 0.5, 15, 18, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 顔のメイン
  ctx.fillStyle = COLORS.SKIN_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20, headY, 15, 18, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 顔のハイライト
  ctx.fillStyle = COLORS.SKIN_HIGHLIGHT;
  ctx.beginPath();
  ctx.ellipse(baseX + 17, headY - 2, 8, 10, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 前髪（風になびく効果 - 立体感強化）
  // 前髪の影
  ctx.fillStyle = COLORS.HAIR_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset * 0.5 + 0.5, headY - 10 + 0.5, 12, 8, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 前髪のメイン
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 20 + animations.hairOffset * 0.5, headY - 10, 12, 8, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // 前髪のハイライト
  ctx.fillStyle = COLORS.HAIR_HIGHLIGHT;
  ctx.beginPath();
  ctx.ellipse(baseX + 18 + animations.hairOffset * 0.3, headY - 12, 6, 4, headTilt, 0, Math.PI * 2);
  ctx.fill();
  
  // サイドの髪（立体感強化）
  // 左サイド
  ctx.fillStyle = COLORS.HAIR_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 8 + animations.hairOffset + 0.5, headY - 3 + 0.5, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 8 + animations.hairOffset, headY - 3, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 右サイド
  ctx.fillStyle = COLORS.HAIR_SHADOW;
  ctx.beginPath();
  ctx.ellipse(baseX + 32 + animations.hairOffset + 0.5, headY - 3 + 0.5, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = COLORS.HAIR_COLOR;
  ctx.beginPath();
  ctx.ellipse(baseX + 32 + animations.hairOffset, headY - 3, 6, 12, headTilt * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 目の形（モダンアニメスタイル）
  const eyeY = headY - 3;
  if (animations.eyeHeight > 2) {
    // 目の影（まぶた）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY - 1, 4.5, animations.eyeHeight * 0.7, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY - 1, 4.5, animations.eyeHeight * 0.7, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 目の白い部分
    ctx.fillStyle = COLORS.WHITE;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 4, animations.eyeHeight * 0.6, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 4, animations.eyeHeight * 0.6, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 虹彩のグラデーション効果
    // 外側の虹彩
    ctx.fillStyle = COLORS.EYE_COLOR;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 3.2, animations.eyeHeight * 0.45, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 3.2, animations.eyeHeight * 0.45, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 虹彩のハイライト
    ctx.fillStyle = COLORS.EYE_HIGHLIGHT;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 2.5, animations.eyeHeight * 0.35, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 2.5, animations.eyeHeight * 0.35, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 瞳孔
    ctx.fillStyle = COLORS.BLACK;
    ctx.beginPath();
    ctx.ellipse(baseX + 14, eyeY, 1.8, animations.eyeHeight * 0.25, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 26, eyeY, 1.8, animations.eyeHeight * 0.25, headTilt * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // メインハイライト（より大きく）
    ctx.fillStyle = COLORS.WHITE;
    ctx.beginPath();
    ctx.ellipse(baseX + 15, eyeY - 1, 1.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 27, eyeY - 1, 1.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // セカンダリハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(baseX + 13, eyeY + 1, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 25, eyeY + 1, 0.6, 0, Math.PI * 2);
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
  
  // 腕（自然な振り修正版）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  if (char.isJumping) {
    // ジャンプ中は腕を上に
    ctx.beginPath();
    ctx.ellipse(baseX + 6, bodyY + 8, 4, 12, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 34, bodyY + 8, 4, 12, -Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 走り中は腕を自然に前後に振る
    const armBaseY = bodyY + 12 + animations.bodyBounce * 0.3;
    const leftArmX = baseX + 6 + animations.armSwing * 0.7; // 控えめな前後移動
    const rightArmX = baseX + 34 - animations.armSwing * 0.7; // 逆位相
    const leftArmY = armBaseY + animations.armSwing * 0.3; // 軽い上下
    const rightArmY = armBaseY - animations.armSwing * 0.3; // 逆の上下
    const leftArmAngle = animations.armSwing * 0.08; // より自然な回転
    const rightArmAngle = -animations.armSwing * 0.08;
    
    ctx.beginPath();
    ctx.ellipse(leftArmX, leftArmY, 4, 12, leftArmAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightArmX, rightArmY, 4, 12, rightArmAngle, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 手（グローブ風修正版）
  ctx.fillStyle = COLORS.WHITE;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.arc(baseX + 6, bodyY + 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 34, bodyY + 18, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const handBaseY = bodyY + 22 + animations.bodyBounce * 0.3;
    const leftHandX = baseX + 6 + animations.armSwing * 0.8; // 腕に合わせた自然な動き
    const rightHandX = baseX + 34 - animations.armSwing * 0.8;
    const leftHandY = handBaseY + animations.armSwing * 0.4; // 腕の上下に合わせる
    const rightHandY = handBaseY - animations.armSwing * 0.4;
    ctx.beginPath();
    ctx.arc(leftHandX, leftHandY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightHandX, rightHandY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // スポーツパンツ（ショートパンツ風修正版）
  ctx.fillStyle = COLORS.PANTS_COLOR;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 35, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 35, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 走り中は足を自然に動かす（自然な歩行サイクル）
    const legBaseY = bodyY + 35 + animations.bodyBounce * 0.2;
    const leftLegX = baseX + 12 + animations.leftLegOffset * 0.3; // より控えめな前後移動
    const rightLegX = baseX + 28 + animations.rightLegOffset * 0.3;
    const leftLegY = legBaseY + Math.abs(animations.leftLegOffset) * 0.2; // より自然な上下
    const rightLegY = legBaseY + Math.abs(animations.rightLegOffset) * 0.2;
    const leftLegAngle = animations.leftLegOffset * 0.06; // より自然な回転
    const rightLegAngle = animations.rightLegOffset * 0.06;
    
    ctx.beginPath();
    ctx.ellipse(leftLegX, leftLegY, 6, 12, leftLegAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightLegX, rightLegY, 6, 12, rightLegAngle, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 足（素肌部分修正版）
  ctx.fillStyle = COLORS.SKIN_COLOR;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 47, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 47, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const feetBaseY = bodyY + 47 + animations.bodyBounce * 0.2;
    const leftFootX = baseX + 12 + animations.leftLegOffset * 0.3;
    const rightFootX = baseX + 28 + animations.rightLegOffset * 0.3;
    const leftFootY = feetBaseY + Math.abs(animations.leftLegOffset) * 0.2;
    const rightFootY = feetBaseY + Math.abs(animations.rightLegOffset) * 0.2;
    
    ctx.beginPath();
    ctx.ellipse(leftFootX, leftFootY, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightFootX, rightFootY, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // スニーカー（白いスポーツシューズ修正版）
  ctx.fillStyle = COLORS.SHOES_COLOR;
  if (char.isJumping) {
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 53, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 53, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // スニーカーのアクセント
    ctx.fillStyle = COLORS.SHOE_ACCENT;
    ctx.beginPath();
    ctx.ellipse(baseX + 12, bodyY + 52, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseX + 28, bodyY + 52, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const shoeBaseY = bodyY + 53 + animations.bodyBounce * 0.2;
    const leftShoeX = baseX + 12 + animations.leftLegOffset * 0.3;
    const rightShoeX = baseX + 28 + animations.rightLegOffset * 0.3;
    const leftShoeY = shoeBaseY + Math.abs(animations.leftLegOffset) * 0.2;
    const rightShoeY = shoeBaseY + Math.abs(animations.rightLegOffset) * 0.2;
    
    ctx.beginPath();
    ctx.ellipse(leftShoeX, leftShoeY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightShoeX, rightShoeY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // スニーカーのアクセント
    ctx.fillStyle = COLORS.SHOE_ACCENT;
    ctx.beginPath();
    ctx.ellipse(leftShoeX, leftShoeY - 1, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightShoeX, rightShoeY - 1, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
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
  if (obstacle.type === 'spike') {
    // 金属スパイクの描画
    const centerX = obstacle.x + obstacle.width / 2;
    const bottomY = obstacle.y + obstacle.height;
    
    // メインスパイクの影（左側）
    ctx.fillStyle = COLORS.SPIKE_SHADOW_COLOR;
    ctx.beginPath();
    ctx.moveTo(obstacle.x + 2, bottomY);
    ctx.lineTo(centerX - 3, obstacle.y);
    ctx.lineTo(centerX, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width / 3, bottomY);
    ctx.closePath();
    ctx.fill();
    
    // メインスパイクの本体
    ctx.fillStyle = COLORS.SPIKE_MAIN_COLOR;
    ctx.beginPath();
    ctx.moveTo(obstacle.x, bottomY);
    ctx.lineTo(centerX, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, bottomY);
    ctx.closePath();
    ctx.fill();
    
    // メインスパイクのハイライト（右側）
    ctx.fillStyle = COLORS.SPIKE_HIGHLIGHT_COLOR;
    ctx.beginPath();
    ctx.moveTo(centerX, obstacle.y);
    ctx.lineTo(centerX + 3, obstacle.y);
    ctx.lineTo(obstacle.x + (obstacle.width * 2/3), bottomY);
    ctx.lineTo(obstacle.x + obstacle.width, bottomY);
    ctx.closePath();
    ctx.fill();
    
    // 小さなトゲ（左側）
    ctx.fillStyle = COLORS.SPIKE_THORN_COLOR;
    for (let i = 1; i <= 3; i++) {
      const thornY = obstacle.y + (obstacle.height * i / 4);
      const thornSize = 4 - i * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 3, thornY + thornSize);
      ctx.lineTo(obstacle.x - 5, thornY);
      ctx.lineTo(obstacle.x + 3, thornY - thornSize);
      ctx.closePath();
      ctx.fill();
    }
    
    // 小さなトゲ（右側）
    for (let i = 1; i <= 3; i++) {
      const thornY = obstacle.y + (obstacle.height * i / 4) + 7; // 左側とズラす
      const thornSize = 4 - i * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(obstacle.x + obstacle.width - 3, thornY + thornSize);
      ctx.lineTo(obstacle.x + obstacle.width + 5, thornY);
      ctx.lineTo(obstacle.x + obstacle.width - 3, thornY - thornSize);
      ctx.closePath();
      ctx.fill();
    }
    
    // スパイクの縁取り（金属的な質感を出すため）
    ctx.strokeStyle = COLORS.SPIKE_SHADOW_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obstacle.x, bottomY);
    ctx.lineTo(centerX, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, bottomY);
    ctx.stroke();
    
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
 * 天気に応じた空の色を取得
 */
const getSkyColors = (weather: WeatherType) => {
  switch (weather) {
    case 'day':
      return {
        top: '#87CEEB',    // 明るい青
        middle: '#B0E0E6', // 薄い青
        bottom: '#F0F8FF'  // 地平線付近は白っぽく
      };
    case 'night':
      return {
        top: '#191970',    // 濃紺
        middle: '#483D8B', // 暗いスレートブルー
        bottom: '#2F2F2F'  // 暗いグレー
      };
    case 'sunny':
      return {
        top: '#FFD700',    // 黄金色
        middle: '#FFA500', // オレンジ色
        bottom: '#FFFFE0'  // 薄い黄色
      };
    case 'rainy':
      return {
        top: '#696969',    // 暗いグレー
        middle: '#778899', // ライトスレートグレー
        bottom: '#D3D3D3'  // 薄いグレー
      };
    default:
      return {
        top: '#87CEEB',
        middle: '#B0E0E6',
        bottom: '#F0F8FF'
      };
  }
};

/**
 * 遠景レイヤーを描画（空、山、雲）
 * @param ctx - 描画コンテキスト
 * @param offset - パララックスオフセット
 * @param weather - 天気の種類
 */
const drawFarBackground = (ctx: CanvasRenderingContext2D, offset: number, weather: WeatherType = 'day') => {
  // 天気に応じた空のグラデーション
  const skyColors = getSkyColors(weather);
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
  skyGradient.addColorStop(0, skyColors.top);
  skyGradient.addColorStop(0.7, skyColors.middle);
  skyGradient.addColorStop(1, skyColors.bottom);
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
  
  // 雲（ゆっくり動く）- 天気により色を変更
  const cloudColor = weather === 'night' ? '#F0F0F0' : 
                     weather === 'rainy' ? '#808080' : 
                     weather === 'sunny' ? '#FFFAF0' : COLORS.WHITE;
  const cloudOffset = offset * 0.8;
  
  for (let i = 0; i < CLOUDS.COUNT * 2; i++) {
    const cloudX = (i * CLOUDS.SPACING - cloudOffset) % (PARALLAX.REPEAT_DISTANCE) - 100;
    const cloudY = CLOUDS.BASE_Y + (i % CLOUDS.COUNT) * CLOUDS.Y_VARIATION;
    
    if (cloudX > -150 && cloudX < GAME_CONFIG.CANVAS_WIDTH + 50) {
      // 雲の影
      const shadowOpacity = weather === 'night' ? 0.3 : 0.1;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
      ctx.beginPath();
      ctx.arc(cloudX + 2, cloudY + 2, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 22, cloudY + 2, 18, 0, Math.PI * 2);
      ctx.arc(cloudX + 42, cloudY + 2, 22, 0, Math.PI * 2);
      ctx.fill();
      
      // 雲本体
      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY, 18, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 雨の場合は雨粒を描画
  if (weather === 'rainy') {
    ctx.strokeStyle = '#4682B4';
    ctx.lineWidth = 1;
    const time = Date.now() * 0.01;
    for (let i = 0; i < 50; i++) {
      const rainX = (i * 20 + time * 3) % GAME_CONFIG.CANVAS_WIDTH;
      const rainY = (time * 15 + i * 30) % 300;
      ctx.beginPath();
      ctx.moveTo(rainX, rainY);
      ctx.lineTo(rainX - 3, rainY + 15);
      ctx.stroke();
    }
  }
  
  // 夜の場合は星を描画
  if (weather === 'night') {
    ctx.fillStyle = '#FFFF00';
    for (let i = 0; i < 20; i++) {
      const starX = (i * 40 + 50) % GAME_CONFIG.CANVAS_WIDTH;
      const starY = 20 + Math.sin(i * 0.5) * 30;
      ctx.beginPath();
      ctx.arc(starX, starY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 晴れの場合は太陽を描画
  if (weather === 'sunny') {
    const sunX = GAME_CONFIG.CANVAS_WIDTH - 100;
    const sunY = 80;
    
    // 太陽本体
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // 太陽の光線
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 40, sunY + Math.sin(angle) * 40);
      ctx.lineTo(sunX + Math.cos(angle) * 50, sunY + Math.sin(angle) * 50);
      ctx.stroke();
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
/**
 * 固定背景を描画（ランナーゲーム用）
 * @param ctx - 描画コンテキスト
 * @param cameraX - カメラのX位置
 * @param weather - 天気の種類
 */
export const drawStaticBackground = (
  ctx: CanvasRenderingContext2D, 
  cameraX: number,
  weather: WeatherType = 'day'
) => {
  // 固定背景を描画（カメラ位置に依存しない）
  drawStaticFarBackground(ctx, weather);
  drawStaticMidBackground(ctx, cameraX);
  drawStaticNearBackground(ctx, cameraX);
  drawStaticForeground(ctx, cameraX);
  
  // テキスト描画のリセット
  ctx.textAlign = 'left';
};

/**
 * 固定遠景レイヤーを描画
 */
const drawStaticFarBackground = (ctx: CanvasRenderingContext2D, weather: WeatherType = 'day') => {
  // 天気に応じた空のグラデーション（固定）
  const skyColors = getSkyColors(weather);
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
  skyGradient.addColorStop(0, skyColors.top);
  skyGradient.addColorStop(0.7, skyColors.middle);
  skyGradient.addColorStop(1, skyColors.bottom);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(-2000, 0, 6000, 300); // 大きな範囲を描画

  // 固定の山々
  ctx.fillStyle = '#9370DB';
  for (let i = -3; i <= 10; i++) {
    const baseX = i * 400;
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

  // 固定の雲 - 天気により色を変更
  const cloudColor = weather === 'night' ? '#F0F0F0' : 
                     weather === 'rainy' ? '#808080' : 
                     weather === 'sunny' ? '#FFFAF0' : COLORS.WHITE;
  ctx.fillStyle = cloudColor;
  for (let i = -2; i <= 12; i++) {
    const cloudX = i * 300 + 50;
    const cloudY = 60 + Math.sin(i * 0.3) * 20;
    
    // 雲の描画
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 15, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY, 20, 0, Math.PI * 2);
    ctx.arc(cloudX + 40, cloudY, 15, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY - 15, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 天気エフェクトを追加
  // 雨の場合は雨粒を描画
  if (weather === 'rainy') {
    ctx.strokeStyle = '#4682B4';
    ctx.lineWidth = 1;
    const time = Date.now() * 0.01;
    for (let i = 0; i < 100; i++) {
      const rainX = (i * 15 + time * 3) % 6000 - 2000;
      const rainY = (time * 15 + i * 20) % 300;
      ctx.beginPath();
      ctx.moveTo(rainX, rainY);
      ctx.lineTo(rainX - 3, rainY + 15);
      ctx.stroke();
    }
  }
  
  // 夜の場合は星を描画
  if (weather === 'night') {
    ctx.fillStyle = '#FFFF00';
    for (let i = 0; i < 50; i++) {
      const starX = (i * 120 + 50) % 6000 - 2000;
      const starY = 20 + Math.sin(i * 0.5) * 30;
      ctx.beginPath();
      ctx.arc(starX, starY, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 月を描画
      if (i === 0) {
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.arc(starX + 100, starY + 20, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFF00'; // 星の色に戻す
      }
    }
  }
  
  // 晴れの場合は太陽を描画
  if (weather === 'sunny') {
    const sunX = 600;
    const sunY = 80;
    
    // 太陽本体
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // 太陽の光線
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 40, sunY + Math.sin(angle) * 40);
      ctx.lineTo(sunX + Math.cos(angle) * 50, sunY + Math.sin(angle) * 50);
      ctx.stroke();
    }
  }
};

/**
 * 建物パターンの定義（無限背景用）
 */
const BUILDING_PATTERNS = [
  { type: 'church', y: 220, width: 60, height: 80 },
  { type: 'castle', y: 240, width: 80, height: 60 },
  { type: 'house', y: 250, width: 50, height: 50 },
  { type: 'windmill', y: 240, width: 40, height: 60 },
  { type: 'market', y: 260, width: 50, height: 40 },
];

/**
 * 建物の間隔（ピクセル）
 */
const BUILDING_SPACING = 200;

/**
 * 無限中景レイヤーを描画
 */
const drawStaticMidBackground = (ctx: CanvasRenderingContext2D, cameraX: number) => {
  // 画面範囲を計算（余裕を持たせる）
  const leftBound = cameraX - 200;
  const rightBound = cameraX + GAME_CONFIG.CANVAS_WIDTH + 200;
  
  // 最初の建物のインデックスを計算
  const firstBuildingIndex = Math.floor(leftBound / BUILDING_SPACING);
  const lastBuildingIndex = Math.ceil(rightBound / BUILDING_SPACING);
  
  // 必要な範囲の建物のみ描画
  for (let i = firstBuildingIndex; i <= lastBuildingIndex; i++) {
    const buildingX = i * BUILDING_SPACING;
    
    // 画面範囲内にある場合のみ描画
    if (buildingX >= leftBound && buildingX <= rightBound) {
      // パターンをループさせる（モジュロ演算）
      const patternIndex = ((i % BUILDING_PATTERNS.length) + BUILDING_PATTERNS.length) % BUILDING_PATTERNS.length;
      const pattern = BUILDING_PATTERNS[patternIndex];
      
      const building = {
        x: buildingX,
        y: pattern.y,
        width: pattern.width,
        height: pattern.height,
        type: pattern.type
      };
      
      // 建物を描画
      drawBuilding(ctx, building);
    }
  }
};

/**
 * 建物の型定義
 */
interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

/**
 * 建物を描画する共通関数
 */
const drawBuilding = (ctx: CanvasRenderingContext2D, building: Building) => {
  switch (building.type) {
    case 'church':
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(building.x, building.y);
      ctx.lineTo(building.x + building.width/2, building.y - 30);
      ctx.lineTo(building.x + building.width, building.y);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'castle':
      ctx.fillStyle = '#696969';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(building.x + 10, building.y - 20, 15, 20);
      ctx.fillRect(building.x + 35, building.y - 15, 15, 15);
      ctx.fillRect(building.x + 55, building.y - 25, 15, 25);
      break;
      
    case 'house':
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(building.x, building.y);
      ctx.lineTo(building.x + building.width/2, building.y - 20);
      ctx.lineTo(building.x + building.width, building.y);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'windmill':
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      const centerX = building.x + building.width/2;
      const centerY = building.y + 15;
      for (let j = 0; j < 4; j++) {
        const angle = j * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * 25, centerY + Math.sin(angle) * 25);
        ctx.stroke();
      }
      break;
      
    case 'market':
      ctx.fillStyle = '#CD853F';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(building.x, building.y);
      ctx.lineTo(building.x + building.width/2, building.y - 15);
      ctx.lineTo(building.x + building.width, building.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(building.x + 5, building.y + 10, 8, 5);
      ctx.fillRect(building.x + 20, building.y + 10, 8, 5);
      ctx.fillRect(building.x + 32, building.y + 10, 8, 5);
      break;
      
    default:
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(building.x, building.y, building.width, building.height);
  }
};

/**
 * 固定近景レイヤーを描画
 */
const drawStaticNearBackground = (ctx: CanvasRenderingContext2D, cameraX: number) => {
  // 草
  ctx.fillStyle = COLORS.GRASS_COLOR;
  for (let i = 0; i < 200; i++) {
    const grassX = i * 40;
    const grassY = 375 + Math.sin(i * 0.5) * 3;
    
    if (grassX > cameraX - 50 && grassX < cameraX + GAME_CONFIG.CANVAS_WIDTH + 50) {
      ctx.fillRect(grassX, grassY, 2, GROUND_LAYERS.GRASS_HEIGHT);
      ctx.fillRect(grassX - 1, grassY + 2, 1, 4);
      ctx.fillRect(grassX + 2, grassY + 1, 1, 5);
    }
  }

  // 小石
  ctx.fillStyle = COLORS.STONE_COLOR;
  for (let i = 0; i < 150; i++) {
    const stoneX = i * 53;
    const stoneY = 370 + Math.sin(i * 0.7) * 8;
    
    if (stoneX > cameraX - 50 && stoneX < cameraX + GAME_CONFIG.CANVAS_WIDTH + 50) {
      ctx.beginPath();
      ctx.arc(stoneX, stoneY, 2 + Math.sin(i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

/**
 * 固定前景レイヤーを描画
 */
const drawStaticForeground = (ctx: CanvasRenderingContext2D, cameraX: number) => {
  // 道路基盤（大きな範囲を描画）
  ctx.fillStyle = GROUND_LAYERS.ROAD_COLOR;
  ctx.fillRect(cameraX - 100, GROUND_LAYERS.ROAD_Y, GAME_CONFIG.CANVAS_WIDTH + 200, GROUND_LAYERS.ROAD_HEIGHT);
  
  // レンガのパターン
  ctx.strokeStyle = COLORS.GROUND_LINE_COLOR;
  ctx.lineWidth = 2;
  
  // 横の線
  for (let y = GROUND_LAYERS.ROAD_Y + 20; y < GROUND_LAYERS.ROAD_Y + GROUND_LAYERS.ROAD_HEIGHT; y += GROUND_LAYERS.BRICK_HEIGHT) {
    ctx.beginPath();
    ctx.moveTo(cameraX - 100, y);
    ctx.lineTo(cameraX + GAME_CONFIG.CANVAS_WIDTH + 100, y);
    ctx.stroke();
  }
  
  // 縦の線（レンガパターン）
  const brickRows = Math.floor(GROUND_LAYERS.ROAD_HEIGHT / GROUND_LAYERS.BRICK_HEIGHT);
  for (let row = 0; row < brickRows; row++) {
    const yPos = GROUND_LAYERS.ROAD_Y + 20 + row * GROUND_LAYERS.BRICK_HEIGHT;
    const brickOffset = (row % 2) * (GROUND_LAYERS.BRICK_WIDTH / 2);
    
    const startX = Math.floor((cameraX - 100) / GROUND_LAYERS.BRICK_WIDTH) * GROUND_LAYERS.BRICK_WIDTH + brickOffset;
    const endX = cameraX + GAME_CONFIG.CANVAS_WIDTH + 100;
    
    for (let x = startX; x < endX; x += GROUND_LAYERS.BRICK_WIDTH) {
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x, yPos + GROUND_LAYERS.BRICK_HEIGHT);
      ctx.stroke();
    }
  }
};


/**
 * スクロール版背景描画（互換性維持）
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

