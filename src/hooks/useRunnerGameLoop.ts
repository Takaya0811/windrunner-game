/**
 * ランナーゲームループ - キャラクター移動版
 * 
 * キャラクターが実際に移動し、カメラが追従するゲームループ
 */

import { useCallback, useEffect, useRef } from 'react';
import { Character, Obstacle, Collectible } from '@/types/game';
import { GAME_CONFIG } from '@/utils/constants';
import { drawCharacter, drawObstacle, drawCollectible, drawStaticBackground } from '@/utils/drawing';
import { checkCharacterObstacleCollision, checkCharacterCollectibleCollision } from '@/utils/collision';

/**
 * カメラ情報
 */
interface Camera {
  x: number; // カメラのX位置
  targetX: number; // カメラの目標X位置
}

/**
 * ランナーゲームループのパラメータ
 */
interface UseRunnerGameLoopParams {
  gameStarted: boolean;
  gameOver: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  keysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  
  // 状態管理関数
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
  setObstacles: React.Dispatch<React.SetStateAction<Obstacle[]>>;
  setCollectibles: React.Dispatch<React.SetStateAction<Collectible[]>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGameSpeed: React.Dispatch<React.SetStateAction<number>>;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  
  // ref
  characterRef: React.MutableRefObject<Character | null>;
  scoreRef: React.MutableRefObject<number>;
  gameSpeedRef: React.MutableRefObject<number>;
  obstaclesRef: React.MutableRefObject<Obstacle[]>;
  collectiblesRef: React.MutableRefObject<Collectible[]>;
}

/**
 * ランナーゲームループ
 */
export const useRunnerGameLoop = (params: UseRunnerGameLoopParams) => {
  const {
    gameStarted,
    gameOver,
    canvasRef,
    keysRef,
    setCharacter,
    setObstacles,
    setCollectibles,
    setScore,
    setGameSpeed,
    setGameOver,
    characterRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef
  } = params;

  const gameLoopRef = useRef<number | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, targetX: 0 });

  /**
   * カメラの位置を更新（スムーズな追従）
   */
  const updateCamera = useCallback((characterX: number) => {
    const camera = cameraRef.current;
    const screenCenterX = GAME_CONFIG.CANVAS_WIDTH / 2;
    
    // キャラクターが画面中央を超えたらカメラを追従
    if (characterX > screenCenterX) {
      camera.targetX = characterX - screenCenterX;
    }
    
    // スムーズなカメラ移動（lerp）
    const lerpFactor = 0.1; // 追従の滑らかさ（0.1 = 10%ずつ近づく）
    camera.x += (camera.targetX - camera.x) * lerpFactor;
  }, []);

  /**
   * メインゲームループ
   */
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentGameSpeed = gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;

    // 1. キャラクター更新
    setCharacter(prev => {
      const newChar = { ...prev };
      
      // キャラクターを常に右に移動（ランナーゲームの基本動作）
      newChar.x += currentGameSpeed;
      
      // ジャンプ処理
      if (keysRef.current?.['Space'] && !newChar.isJumping) {
        newChar.velocityY = GAME_CONFIG.JUMP_FORCE;
        newChar.isJumping = true;
      }
      
      // 左右移動処理（微調整用）
      if (keysRef.current?.['ArrowLeft']) {
        newChar.x = Math.max(0, newChar.x - GAME_CONFIG.PLAYER_SPEED);
      }
      if (keysRef.current?.['ArrowRight']) {
        newChar.x += GAME_CONFIG.PLAYER_SPEED;
      }
      
      // 重力処理
      if (newChar.isJumping) {
        newChar.y += newChar.velocityY;
        newChar.velocityY += GAME_CONFIG.GRAVITY;
        
        // 地面に着地したかチェック
        if (newChar.y >= GAME_CONFIG.GROUND_Y) {
          newChar.y = GAME_CONFIG.GROUND_Y;
          newChar.isJumping = false;
          newChar.velocityY = 0;
        }
      }
      
      // アニメーションフレーム更新
      newChar.animationFrame += 1;
      return newChar;
    });

    // 2. カメラ更新
    const currentCharacter = characterRef.current;
    if (currentCharacter) {
      updateCamera(currentCharacter.x);
    }

    // 3. 障害物の生成と更新
    setObstacles(prev => {
      let newObstacles = [...prev];
      
      // キャラクターの位置に基づいて新しい障害物を生成
      const characterX = currentCharacter?.x || 0;
      const lastObstacle = newObstacles[newObstacles.length - 1];
      const shouldSpawn = Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE && 
                         (!lastObstacle || (characterX + GAME_CONFIG.CANVAS_WIDTH - lastObstacle.x) > GAME_CONFIG.OBSTACLE_MIN_DISTANCE);
      
      if (shouldSpawn) {
        const type = Math.random() < GAME_CONFIG.CACTUS_SPAWN_RATE ? 'cactus' : 'bird';
        newObstacles.push({
          x: characterX + GAME_CONFIG.CANVAS_WIDTH, // キャラクターの前方に生成
          y: type === 'cactus' ? GAME_CONFIG.CACTUS_Y : GAME_CONFIG.BIRD_Y,
          width: type === 'cactus' ? GAME_CONFIG.CACTUS_WIDTH : GAME_CONFIG.BIRD_WIDTH,
          height: type === 'cactus' ? GAME_CONFIG.CACTUS_HEIGHT : GAME_CONFIG.BIRD_HEIGHT,
          type: type
        });
      }
      
      // 画面外に出た障害物を削除（カメラ位置を考慮）
      const cameraX = cameraRef.current.x;
      newObstacles = newObstacles.filter(obs => obs.x > cameraX - 100);
      
      return newObstacles;
    });

    // 4. アイテムの生成と更新
    setCollectibles(prev => {
      let newCollectibles = [...prev];
      
      // キャラクターの位置に基づいて新しいアイテムを生成
      const characterX = currentCharacter?.x || 0;
      if (Math.random() < GAME_CONFIG.COLLECTIBLE_SPAWN_RATE) {
        newCollectibles.push({
          x: characterX + GAME_CONFIG.CANVAS_WIDTH + Math.random() * 200,
          y: 200 + Math.random() * 100,
          width: GAME_CONFIG.COLLECTIBLE_WIDTH,
          height: GAME_CONFIG.COLLECTIBLE_HEIGHT,
          collected: false
        });
      }
      
      // 画面外に出たアイテムを削除（カメラ位置を考慮）
      const cameraX = cameraRef.current.x;
      newCollectibles = newCollectibles.filter(item => item.x > cameraX - 100);
      
      return newCollectibles;
    });

    // 5. スコアとゲーム速度の更新
    setScore(prev => prev + 1);
    setGameSpeed(prev => Math.min(prev + GAME_CONFIG.SPEED_INCREASE, GAME_CONFIG.MAX_GAME_SPEED));

    // 6. 衝突判定
    if (currentCharacter) {
      // 障害物との衝突判定
      obstaclesRef.current?.forEach(obstacle => {
        if (checkCharacterObstacleCollision(currentCharacter, obstacle)) {
          setGameOver(true);
          return;
        }
      });

      // アイテム収集判定
      setCollectibles(prevCollectibles => 
        prevCollectibles.map(item => {
          if (!item.collected && checkCharacterCollectibleCollision(currentCharacter, item)) {
            setScore(s => s + GAME_CONFIG.COLLECTIBLE_SCORE);
            return { ...item, collected: true };
          }
          return item;
        })
      );
    }

    // 7. 画面描画
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // カメラオフセットを適用
    const cameraX = cameraRef.current.x;
    ctx.save();
    ctx.translate(-cameraX, 0);
    
    // 固定背景を描画
    drawStaticBackground(ctx, cameraX);
    
    // キャラクター描画
    if (currentCharacter) {
      drawCharacter(ctx, currentCharacter, currentGameSpeed);
    }
    
    // 障害物とアイテムを描画
    obstaclesRef.current?.forEach(obs => drawObstacle(ctx, obs));
    collectiblesRef.current?.forEach(item => drawCollectible(ctx, item));

    ctx.restore();

    // 次のフレームをスケジュール
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameStarted, 
    gameOver, 
    canvasRef, 
    keysRef, 
    setCharacter, 
    setObstacles, 
    setCollectibles, 
    setScore, 
    setGameSpeed, 
    setGameOver,
    characterRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    updateCamera
  ]);

  /**
   * ゲームループの開始
   */
  const startGameLoop = useCallback(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop, gameStarted, gameOver]);

  /**
   * ゲームループの停止
   */
  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // ゲームループの開始・停止管理
  useEffect(() => {
    startGameLoop();
    
    return () => {
      stopGameLoop();
    };
  }, [startGameLoop, stopGameLoop]);

  return {
    startGameLoop,
    stopGameLoop,
    gameLoopRef,
    camera: cameraRef.current,
  };
};