/**
 * ゲームループを管理するカスタムフック
 * 
 * このファイルは、ゲームのメインループ処理を管理するカスタムフックです。
 * 初心者向け解説：
 * - 「カスタムフック」とは、独自のReactフック関数のこと
 * - ゲームループのロジックを分離することで、再利用性と保守性が向上
 * - メインコンポーネントがより簡潔になり、責任が明確に分離される
 */

import { useCallback, useEffect, useRef } from 'react';
import { Character, Obstacle, Collectible } from '@/types/game';
import { GAME_CONFIG } from '@/utils/constants';
import { drawCharacter, drawObstacle, drawCollectible, drawBackground } from '@/utils/drawing';
import { checkCharacterObstacleCollision, checkCharacterCollectibleCollision } from '@/utils/collision';
import { calculateBackgroundScroll } from '@/utils/memoizedCalculations';

/**
 * ゲームループで使用するパラメータの型定義
 */
interface UseGameLoopParams {
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
  
  // 最新状態のRef
  characterRef: React.MutableRefObject<Character | null>;
  scoreRef: React.MutableRefObject<number>;
  gameSpeedRef: React.MutableRefObject<number>;
  obstaclesRef: React.MutableRefObject<Obstacle[]>;
  collectiblesRef: React.MutableRefObject<Collectible[]>;
}

/**
 * ゲームループを管理するカスタムフック
 * 
 * @param params - ゲームループに必要なパラメータ
 * @returns ゲームループの制御関数
 */
export const useGameLoop = (params: UseGameLoopParams) => {
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
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef
  } = params;

  const gameLoopRef = useRef<number | null>(null);

  /**
   * メインゲームループ処理（useCallbackで最適化済み）
   * 
   * 初心者向け解説：
   * このゲームループは60FPS（1秒間に60回）実行されます。
   * 各フレームで以下の処理を行います：
   * 1. キャラクターの更新（移動、ジャンプ、重力）
   * 2. 障害物の生成と移動
   * 3. アイテムの生成と移動
   * 4. スコアとゲーム速度の更新
   * 5. 衝突判定
   * 6. 画面描画
   */
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. キャラクター更新
    setCharacter(prev => {
      const newChar = { ...prev };
      
      // ジャンプ処理
      if (keysRef.current?.['Space'] && !newChar.isJumping) {
        newChar.velocityY = GAME_CONFIG.JUMP_FORCE;
        newChar.isJumping = true;
      }
      
      // 左右移動処理
      if (keysRef.current?.['ArrowLeft']) {
        newChar.x = Math.max(0, newChar.x - GAME_CONFIG.PLAYER_SPEED);
      }
      if (keysRef.current?.['ArrowRight']) {
        newChar.x = Math.min(GAME_CONFIG.CANVAS_WIDTH - newChar.width, newChar.x + GAME_CONFIG.PLAYER_SPEED);
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

    // 2. 障害物の生成と更新
    setObstacles(prev => {
      let newObstacles = [...prev];
      
      // 新しい障害物の生成（適切な間隔を保つ）
      const lastObstacle = newObstacles[newObstacles.length - 1];
      if (Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE && 
          (!lastObstacle || (GAME_CONFIG.CANVAS_WIDTH - lastObstacle.x) > GAME_CONFIG.OBSTACLE_MIN_DISTANCE)) {
        const type = Math.random() < GAME_CONFIG.CACTUS_SPAWN_RATE ? 'cactus' : 'bird';
        newObstacles.push({
          x: GAME_CONFIG.CANVAS_WIDTH,
          y: type === 'cactus' ? GAME_CONFIG.CACTUS_Y : GAME_CONFIG.BIRD_Y,
          width: type === 'cactus' ? GAME_CONFIG.CACTUS_WIDTH : GAME_CONFIG.BIRD_WIDTH,
          height: type === 'cactus' ? GAME_CONFIG.CACTUS_HEIGHT : GAME_CONFIG.BIRD_HEIGHT,
          type: type
        });
      }
      
      // 障害物の移動（画面外に出たものは削除）
      newObstacles = newObstacles.filter(obs => {
        obs.x -= gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;
        return obs.x > -50;
      });
      
      return newObstacles;
    });

    // 3. アイテムの生成と更新
    setCollectibles(prev => {
      let newCollectibles = [...prev];
      
      // 新しいアイテムの生成
      if (Math.random() < GAME_CONFIG.COLLECTIBLE_SPAWN_RATE) {
        newCollectibles.push({
          x: GAME_CONFIG.CANVAS_WIDTH,
          y: 200 + Math.random() * 100,
          width: GAME_CONFIG.COLLECTIBLE_WIDTH,
          height: GAME_CONFIG.COLLECTIBLE_HEIGHT,
          collected: false
        });
      }
      
      // アイテムの移動（画面外に出たものは削除）
      newCollectibles = newCollectibles.filter(item => {
        item.x -= gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;
        return item.x > -30;
      });
      
      return newCollectibles;
    });

    // 4. スコアとゲーム速度の更新
    setScore(prev => prev + 1);
    setGameSpeed(prev => Math.min(prev + GAME_CONFIG.SPEED_INCREASE, GAME_CONFIG.MAX_GAME_SPEED));

    // 5. 衝突判定（フレーム同期）
    const currentCharacter = characterRef.current;
    const currentObstacles = obstaclesRef.current;
    
    if (currentCharacter) {
      // 障害物との衝突判定（ゲームオーバーチェック）
      currentObstacles?.forEach(obstacle => {
        if (checkCharacterObstacleCollision(currentCharacter, obstacle)) {
          setGameOver(true);
          return; // ゲーム終了時は早期終了
        }
      });

      // アイテム収集判定
      setCollectibles(prev => 
        prev.map(item => {
          if (!item.collected && checkCharacterCollectibleCollision(currentCharacter, item)) {
            setScore(s => s + GAME_CONFIG.COLLECTIBLE_SCORE);
            return { ...item, collected: true };
          }
          return item;
        })
      );
    }

    // 6. 画面描画（最新の状態を使用、最適化された計算値を活用）
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // 背景描画の計算値を準備
    const currentScore = scoreRef.current || 0;
    const currentGameSpeed = gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;
    const backgroundCalculations = calculateBackgroundScroll(currentScore, currentGameSpeed);
    

    // 描画実行
    drawBackground(ctx, currentScore, currentGameSpeed, backgroundCalculations);
    if (currentCharacter) {
      drawCharacter(ctx, currentCharacter, currentGameSpeed);
    }
    obstaclesRef.current?.forEach(obs => drawObstacle(ctx, obs));
    collectiblesRef.current?.forEach(item => drawCollectible(ctx, item));

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
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef
  ]); // 必要な依存関係のみ指定

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
    gameLoopRef
  };
};