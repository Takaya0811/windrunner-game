/**
 * リファクタリング後のゲームループ
 * 新しいシステムを統合した保守性の高い実装
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Character, Obstacle, Collectible } from '@/types/game';
import { CharacterController } from '@/systems/character/CharacterController';
import { AnimationController } from '@/systems/animation/AnimationController';
import { CollisionSystem } from '@/systems/collision/CollisionSystem';
import { PerformanceManager } from '@/systems/performance/PerformanceManager';
import { ICharacterInput, StateChangeListener } from '@/types/character';
import { GAME_CONFIG } from '@/utils/constants';
import { drawCharacter, drawObstacle, drawCollectible, drawBackground } from '@/utils/drawing';

interface UseRefactoredGameLoopParams {
  gameStarted: boolean;
  gameOver: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  keysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  
  // 状態管理関数
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

export const useRefactoredGameLoop = (params: UseRefactoredGameLoopParams) => {
  const {
    gameStarted,
    gameOver,
    canvasRef,
    keysRef,
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

  // システムインスタンス
  const [characterController] = useState(() => 
    new CharacterController({
      x: GAME_CONFIG.PLAYER_START_X,
      y: GAME_CONFIG.PLAYER_START_Y,
      width: GAME_CONFIG.PLAYER_WIDTH,
      height: GAME_CONFIG.PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      animationFrame: 0
    })
  );

  const [animationController] = useState(() => new AnimationController());
  const [collisionSystem] = useState(() => 
    new CollisionSystem(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
  );
  const [performanceManager] = useState(() => new PerformanceManager());

  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // 状態変更リスナー
  const handleStateChange = useCallback<StateChangeListener>((event) => {
    const animationName = animationController.getCharacterAnimationName(event.to);
    animationController.playAnimation('character', animationName);
  }, [animationController]);

  // 初期化
  useEffect(() => {
    characterController.addStateChangeListener(handleStateChange);
    performanceManager.startMonitoring();
    
    // 初期アニメーション設定
    animationController.playAnimation('character', 'character_idle');

    return () => {
      characterController.removeStateChangeListener(handleStateChange);
      performanceManager.stopMonitoring();
    };
  }, [characterController, handleStateChange, performanceManager, animationController]);

  /**
   * 入力の変換
   */
  const createCharacterInput = useCallback((deltaTime: number): ICharacterInput => {
    return {
      jump: keysRef.current?.['Space'] || false,
      left: keysRef.current?.['ArrowLeft'] || false,
      right: keysRef.current?.['ArrowRight'] || false,
      deltaTime
    };
  }, [keysRef]);

  /**
   * オブジェクト生成処理
   */
  const spawnObjects = useCallback((deltaTime: number) => {
    const currentGameSpeed = gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;

    // 障害物の生成
    setObstacles(prev => {
      const lastObstacle = prev[prev.length - 1];
      let newObstacles = [...prev];
      
      if (Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE * deltaTime * 60 && 
          (!lastObstacle || (GAME_CONFIG.CANVAS_WIDTH - lastObstacle.x) > GAME_CONFIG.OBSTACLE_MIN_DISTANCE)) {
        
        const obstacle = performanceManager.getFromPool<Obstacle>('obstacle');
        if (obstacle) {
          const type = Math.random() < GAME_CONFIG.SPIKE_SPAWN_RATE ? 'spike' : 'bird';
          Object.assign(obstacle, {
            x: GAME_CONFIG.CANVAS_WIDTH,
            y: type === 'spike' ? GAME_CONFIG.SPIKE_Y : GAME_CONFIG.BIRD_Y,
            width: type === 'spike' ? GAME_CONFIG.SPIKE_WIDTH : GAME_CONFIG.BIRD_WIDTH,
            height: type === 'spike' ? GAME_CONFIG.SPIKE_HEIGHT : GAME_CONFIG.BIRD_HEIGHT,
            type: type,
            // 鳥の場合は動作用のパラメータを追加
            baseY: type === 'bird' ? GAME_CONFIG.BIRD_Y : undefined,
            animationTime: type === 'bird' ? 0 : undefined,
            velocityX: type === 'bird' ? 0 : undefined, // 初期の横方向速度
            velocityY: type === 'bird' ? 0 : undefined  // 初期の縦方向速度
          });
          newObstacles.push(obstacle);
        }
      }
      
      // 鳥の上下動作とプレイヤー追跡を更新
      newObstacles.forEach(obs => {
        if (obs.type === 'bird' && obs.baseY !== undefined && obs.animationTime !== undefined) {
          // アニメーション時間を更新
          obs.animationTime += GAME_CONFIG.BIRD_MOVEMENT_SPEED * deltaTime * 60;
          
          // プレイヤー追跡ロジック（プレイヤーが近くにいる場合のみ）
          if (characterRef.current && obs.velocityX !== undefined && obs.velocityY !== undefined) {
            const distanceToPlayer = Math.abs(characterRef.current.x - obs.x);
            
            if (distanceToPlayer < GAME_CONFIG.BIRD_TRACKING_RANGE) {
              // プレイヤー方向への軽い追跡
              const targetX = characterRef.current.x;
              const targetY = characterRef.current.y;
              
              const deltaX = targetX - obs.x;
              const deltaY = targetY - obs.y;
              
              // 軽い追跡力を加算（ゆっくりと寄ってくる）
              obs.velocityX += deltaX * GAME_CONFIG.BIRD_TRACKING_SPEED * 0.001 * deltaTime * 60;
              obs.velocityY += deltaY * GAME_CONFIG.BIRD_TRACKING_SPEED * 0.001 * deltaTime * 60;
              
              // 速度の上限を設定（暴走を防ぐ）
              const maxVelocity = 1.5;
              obs.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, obs.velocityX));
              obs.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, obs.velocityY));
            }
          }
          
          // 基本的な上下動作（サイン波）と追跡を組み合わせ
          const baseMovement = Math.sin(obs.animationTime) * (GAME_CONFIG.BIRD_MOVEMENT_RANGE / 2);
          const trackingMovement = obs.velocityY || 0;
          
          // 基準位置から基本動作+追跡動作を適用
          obs.y = obs.baseY + baseMovement + trackingMovement;
          
          // 横方向の追跡も適用
          if (obs.velocityX !== undefined) {
            obs.x += obs.velocityX * deltaTime * 60;
          }
          
          // 画面の境界内に制限
          obs.y = Math.max(50, Math.min(350, obs.y));
        }
      });
      
      // 障害物の移動と削除
      newObstacles = newObstacles.filter(obs => {
        obs.x -= currentGameSpeed * deltaTime * 60;
        if (obs.x < -50) {
          performanceManager.returnToPool('obstacle', obs);
          return false;
        }
        return true;
      });
      
      return newObstacles;
    });

    // 収集アイテムの生成
    setCollectibles(prev => {
      let newCollectibles = [...prev];
      
      if (Math.random() < GAME_CONFIG.COLLECTIBLE_SPAWN_RATE * deltaTime * 60) {
        const collectible = performanceManager.getFromPool<Collectible>('collectible');
        if (collectible) {
          Object.assign(collectible, {
            x: GAME_CONFIG.CANVAS_WIDTH,
            y: 200 + Math.random() * 100,
            width: GAME_CONFIG.COLLECTIBLE_WIDTH,
            height: GAME_CONFIG.COLLECTIBLE_HEIGHT,
            collected: false
          });
          newCollectibles.push(collectible);
        }
      }
      
      // アイテムの移動と削除
      newCollectibles = newCollectibles.filter(item => {
        item.x -= currentGameSpeed * deltaTime * 60;
        if (item.x < -30) {
          performanceManager.returnToPool('collectible', item);
          return false;
        }
        return true;
      });
      
      return newCollectibles;
    });
  }, [setObstacles, setCollectibles, gameSpeedRef, performanceManager]);

  /**
   * 衝突判定処理
   */
  const handleCollisions = useCallback(() => {
    performanceManager.startMeasure('collision');
    
    const character = characterController.character;
    
    // 衝突システムにオブジェクトを登録
    collisionSystem.clearGrid();
    obstaclesRef.current?.forEach(obstacle => {
      collisionSystem.addObjectToGrid(obstacle);
    });
    collectiblesRef.current?.forEach(collectible => {
      collisionSystem.addObjectToGrid(collectible);
    });

    // 障害物との衝突判定
    const collidingObstacles = collisionSystem.checkObstacleCollisions(character);
    if (collidingObstacles.length > 0) {
      setGameOver(true);
      performanceManager.endMeasure('collision');
      return;
    }

    // アイテム収集判定
    const collidingCollectibles = collisionSystem.checkCollectibleCollisions(character);
    if (collidingCollectibles.length > 0) {
      setCollectibles(prev => 
        prev.map(item => {
          if (collidingCollectibles.includes(item)) {
            setScore(s => s + GAME_CONFIG.COLLECTIBLE_SCORE);
            return { ...item, collected: true };
          }
          return item;
        })
      );
    }

    performanceManager.endMeasure('collision');
  }, [characterController, collisionSystem, obstaclesRef, collectiblesRef, setGameOver, setCollectibles, setScore, performanceManager]);

  /**
   * レンダリング処理
   */
  const render = useCallback(() => {
    performanceManager.startMeasure('render');
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScore = scoreRef.current || 0;
    const currentGameSpeed = gameSpeedRef.current || GAME_CONFIG.INITIAL_GAME_SPEED;
    const character = characterController.character;

    // 品質調整
    const quality = performanceManager.getCurrentQuality();
    if (quality < 1.0) {
      ctx.imageSmoothingEnabled = false;
    }

    // 画面クリア
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // 背景描画
    drawBackground(ctx, currentScore, currentGameSpeed);
    
    // キャラクター描画
    if (character) {
      // アニメーションフレームを更新
      character.animationFrame = animationController.getCurrentFrame('character');
      drawCharacter(ctx, character, currentGameSpeed);
    }
    
    // オブジェクト描画
    obstaclesRef.current?.forEach(obs => drawObstacle(ctx, obs));
    collectiblesRef.current?.forEach(item => drawCollectible(ctx, item));

    performanceManager.endMeasure('render');
  }, [canvasRef, scoreRef, gameSpeedRef, characterController, obstaclesRef, collectiblesRef, animationController, performanceManager]);

  /**
   * メインゲームループ
   */
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameStarted || gameOver) return;

    performanceManager.startFrame();
    
    // デルタタイム計算
    const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;
    
    // 60FPSに制限
    if (deltaTime > 1/60) {
      performanceManager.endFrame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // 更新処理
    performanceManager.startMeasure('update');
    
    // キャラクター更新
    const input = createCharacterInput(deltaTime);
    characterController.update(input, deltaTime);
    
    // キャラクター状態をrefに同期
    if (characterRef.current) {
      Object.assign(characterRef.current, characterController.character);
    }
    
    // オブジェクト生成・更新
    spawnObjects(deltaTime);
    
    // スコアとゲーム速度の更新
    setScore(prev => prev + Math.floor(deltaTime * 60));
    setGameSpeed(prev => Math.min(prev + GAME_CONFIG.SPEED_INCREASE * deltaTime * 60, GAME_CONFIG.MAX_GAME_SPEED));
    
    performanceManager.endMeasure('update');

    // アニメーション更新
    performanceManager.startMeasure('animation');
    animationController.update(deltaTime);
    performanceManager.endMeasure('animation');

    // 衝突判定
    handleCollisions();

    // レンダリング
    render();

    performanceManager.endFrame();

    // 次のフレーム
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameStarted, 
    gameOver, 
    characterController,
    createCharacterInput,
    spawnObjects,
    handleCollisions,
    render,
    characterRef,
    setScore,
    setGameSpeed,
    animationController,
    performanceManager
  ]);

  /**
   * ゲームループ開始
   */
  const startGameLoop = useCallback(() => {
    if (gameStarted && !gameOver) {
      lastFrameTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop, gameStarted, gameOver]);

  /**
   * ゲームループ停止
   */
  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // ゲームループ管理
  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, [startGameLoop, stopGameLoop]);

  // ゲームリセット時の処理
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      characterController.resetToInitialState();
    }
  }, [gameStarted, gameOver, characterController]);

  return {
    startGameLoop,
    stopGameLoop,
    characterController,
    animationController,
    collisionSystem,
    performanceManager,
    gameLoopRef
  };
};