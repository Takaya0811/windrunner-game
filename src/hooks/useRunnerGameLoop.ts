/**
 * ランナーゲームループ - キャラクター移動版
 * 
 * キャラクターが実際に移動し、カメラが追従するゲームループ
 */

import { useCallback, useEffect, useRef } from 'react';
import { Character, Obstacle, Collectible, Weather, BackgroundInfo } from '@/types/game';
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
  updateWeather: (distance: number) => void;
  updateBackgroundInfo: (distance: number) => void;
  
  // ref
  characterRef: React.MutableRefObject<Character | null>;
  scoreRef: React.MutableRefObject<number>;
  gameSpeedRef: React.MutableRefObject<number>;
  obstaclesRef: React.MutableRefObject<Obstacle[]>;
  collectiblesRef: React.MutableRefObject<Collectible[]>;
  weatherRef: React.MutableRefObject<Weather>;
  backgroundInfoRef: React.MutableRefObject<BackgroundInfo>;
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
    updateWeather,
    updateBackgroundInfo,
    characterRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    weatherRef,
    backgroundInfoRef
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

    // 1. キャラクター更新と天気更新
    setCharacter(prev => {
      const newChar = { ...prev };
      
      // キャラクターを常に右に移動（ランナーゲームの基本動作）
      newChar.x += currentGameSpeed;
      
      // 天気システム更新：プレイヤーの移動距離に基づいて天気を更新
      updateWeather(newChar.x);
      
      // 背景テーマ更新：プレイヤーの移動距離に基づいて背景テーマを更新
      updateBackgroundInfo(newChar.x);
      
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
        
        // 落とし穴の上にいるかチェック
        const isOverPitfall = obstaclesRef.current?.some(obstacle => 
          obstacle.type === 'pitfall' &&
          newChar.x + newChar.width > obstacle.x &&
          newChar.x < obstacle.x + obstacle.width
        ) || false;
        
        // 地面に着地したかチェック（落とし穴の上でない場合のみ）
        if (!isOverPitfall && newChar.y >= GAME_CONFIG.GROUND_Y) {
          newChar.y = GAME_CONFIG.GROUND_Y;
          newChar.isJumping = false;
          newChar.velocityY = 0;
        }
      } else {
        // 地面にいるときも落とし穴チェックが必要
        const isOverPitfall = obstaclesRef.current?.some(obstacle => 
          obstacle.type === 'pitfall' &&
          newChar.x + newChar.width > obstacle.x &&
          newChar.x < obstacle.x + obstacle.width
        ) || false;
        
        // 落とし穴の上にいる場合は落下開始
        if (isOverPitfall && newChar.y >= GAME_CONFIG.GROUND_Y) {
          newChar.isJumping = true;
          newChar.velocityY = 0; // 落下開始時の速度
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
        // 3つの障害物タイプから確率的に選択
        const randomValue = Math.random();
        let type: 'spike' | 'bird' | 'pitfall';
        
        if (randomValue < GAME_CONFIG.SPIKE_SPAWN_RATE) {
          type = 'spike';
        } else if (randomValue < GAME_CONFIG.SPIKE_SPAWN_RATE + GAME_CONFIG.BIRD_SPAWN_RATE) {
          type = 'bird';
        } else {
          type = 'pitfall';
        }
        
        // 障害物の重なりを回避するため、最後の障害物と同じ範囲を避ける
        if (lastObstacle) {
          const newX = characterX + GAME_CONFIG.CANVAS_WIDTH;
          const distance = newX - lastObstacle.x;
          
          // 距離が近すぎる場合、異なる高度の障害物を優先的に選択
          if (distance < GAME_CONFIG.OBSTACLE_MIN_DISTANCE * 1.5) {
            if (lastObstacle.type === 'spike') {
              // 前がスパイクなら鳥または落とし穴を生成
              type = Math.random() < 0.5 ? 'bird' : 'pitfall';
            } else if (lastObstacle.type === 'bird') {
              // 前が鳥の場合、スパイクまたは落とし穴を生成
              type = Math.random() < 0.5 ? 'spike' : 'pitfall';
            } else if (lastObstacle.type === 'pitfall') {
              // 前が落とし穴の場合、スパイクまたは鳥を生成
              type = Math.random() < 0.5 ? 'spike' : 'bird';
            }
          }
        }
        
        const obstacle: Obstacle = {
          x: characterX + GAME_CONFIG.CANVAS_WIDTH, // キャラクターの前方に生成
          y: type === 'spike' ? GAME_CONFIG.SPIKE_Y : 
             type === 'bird' ? GAME_CONFIG.BIRD_Y : 
             GAME_CONFIG.PITFALL_Y,
          width: type === 'spike' ? GAME_CONFIG.SPIKE_WIDTH : 
                 type === 'bird' ? GAME_CONFIG.BIRD_WIDTH : 
                 GAME_CONFIG.PITFALL_WIDTH,
          height: type === 'spike' ? GAME_CONFIG.SPIKE_HEIGHT : 
                  type === 'bird' ? GAME_CONFIG.BIRD_HEIGHT : 
                  GAME_CONFIG.PITFALL_HEIGHT,
          type: type
        };
        
        // 鳥の場合は動作用のパラメータを追加
        if (type === 'bird') {
          obstacle.baseY = GAME_CONFIG.BIRD_Y;
          obstacle.animationTime = 0;
          obstacle.velocityX = 0; // 初期の横方向速度
          obstacle.velocityY = 0; // 初期の縦方向速度
          obstacle.isTracking = false; // 初期状態では追跡していない
        }
        
        newObstacles.push(obstacle);
      }
      
      // 鳥の上下動作とプレイヤー追跡を更新
      newObstacles = newObstacles.map(obs => {
        if (obs.type === 'bird' && obs.baseY !== undefined && obs.animationTime !== undefined) {
          // アニメーション時間を更新
          obs.animationTime += GAME_CONFIG.BIRD_MOVEMENT_SPEED;
          
          // プレイヤー追跡ロジック
          if (currentCharacter && obs.velocityX !== undefined && obs.velocityY !== undefined && obs.isTracking !== undefined) {
            const distanceToPlayer = Math.abs(currentCharacter.x - obs.x);
            
            // 追跡開始の条件：プレイヤーが追跡範囲内にいて、まだ追跡していない、かつプレイヤーが鳥より前にいる
            if (!obs.isTracking && distanceToPlayer < GAME_CONFIG.BIRD_TRACKING_RANGE && currentCharacter.x < obs.x) {
              obs.isTracking = true;
            }
            
            // 追跡解除の条件：プレイヤーが鳥を通り過ぎた場合（プレイヤーのX座標が鳥より後ろになった）
            if (obs.isTracking && currentCharacter.x > obs.x) {
              obs.isTracking = false;
              // 追跡解除時に速度をリセット（基本動作に戻る）
              obs.velocityX = 0;
              obs.velocityY = 0;
            }
            
            // 追跡中の場合のみプレイヤー方向に移動
            if (obs.isTracking) {
              // スパイク回避ロジック
              const targetX = currentCharacter.x;
              let targetY = currentCharacter.y;
              
              // 近くにスパイクがあるかチェック
              const nearbySpikes = newObstacles.filter(spike => 
                spike.type === 'spike' && 
                Math.abs(spike.x - obs.x) < 100 && // 100ピクセル以内
                Math.abs(spike.y - obs.y) < 80     // 80ピクセル以内
              );
              
              // スパイクが近くにある場合、迂回するように目標位置を調整
              if (nearbySpikes.length > 0) {
                const closestSpike = nearbySpikes.reduce((closest, spike) => {
                  const distToSpike = Math.abs(spike.x - obs.x) + Math.abs(spike.y - obs.y);
                  const distToClosest = Math.abs(closest.x - obs.x) + Math.abs(closest.y - obs.y);
                  return distToSpike < distToClosest ? spike : closest;
                });
                
                // スパイクを迂回するために上方向に移動目標を設定
                if (obs.y > closestSpike.y) {
                  targetY = Math.max(50, closestSpike.y - 60); // スパイクより上に
                } else {
                  targetY = Math.min(200, closestSpike.y - 40); // スパイクから離れる
                }
              }
              
              const deltaX = targetX - obs.x;
              const deltaY = targetY - obs.y;
              
              // 軽い追跡力を加算
              obs.velocityX += deltaX * GAME_CONFIG.BIRD_TRACKING_SPEED * 0.001;
              obs.velocityY += deltaY * GAME_CONFIG.BIRD_TRACKING_SPEED * 0.001;
              
              // 速度の上限を設定
              const maxVelocity = 1.5;
              obs.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, obs.velocityX));
              obs.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, obs.velocityY));
            }
          }
          
          // 基本的な上下動作（サイン波）と追跡を組み合わせ
          const baseMovement = Math.sin(obs.animationTime) * (GAME_CONFIG.BIRD_MOVEMENT_RANGE / 2);
          let trackingMovement = 0;
          
          // 追跡中の場合のみ追跡動作を適用
          if (obs.isTracking) {
            trackingMovement = obs.velocityY || 0;
          }
          
          // 基準位置から基本動作+追跡動作を適用
          obs.y = obs.baseY + baseMovement + trackingMovement;
          
          // 横方向の追跡も適用（追跡中の場合のみ）
          if (obs.isTracking && obs.velocityX !== undefined) {
            obs.x += obs.velocityX;
          }
          
          // 画面の境界内に制限
          obs.y = Math.max(50, Math.min(350, obs.y)); // 画面上下の境界
        }
        return obs;
      });
      
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

    // 6. 落下判定とゲームオーバーチェック
    if (currentCharacter) {
      // キャラクターが画面下に落ちた場合のゲームオーバー判定
      if (currentCharacter.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
        setGameOver(true);
        return;
      }
      
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
    
    // 固定背景を描画（天気情報と背景テーマ情報を含む）
    const currentWeather = weatherRef.current || {
      current: 'day' as const,
      next: 'night' as const,
      distance: 0,
      changeDistance: 1000,
      transitionProgress: 0,
      isTransitioning: false,
    };
    const currentBackgroundInfo = backgroundInfoRef.current || {
      current: 'japan' as const,
      distance: 0,
      changeDistance: 2500,
    };
    drawStaticBackground(ctx, cameraX, currentWeather, currentBackgroundInfo);
    
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
    updateWeather,
    updateBackgroundInfo,
    characterRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    weatherRef,
    backgroundInfoRef,
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