'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  isOnGround: boolean;
  animationFrame: number;
  animationTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface GameState {
  score: number;
  gameOver: boolean;
  gameStarted: boolean;
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  
  const [character, setCharacter] = useState<Character>({
    x: 100,
    y: 300,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    isOnGround: true,
    animationFrame: 0,
    animationTimer: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    gameOver: false,
    gameStarted: false
  });

  // ゲーム定数
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_Y = 300;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const PLAYER_SPEED = 5;
  const OBSTACLE_SPEED = 3;

  // キャラクターの描画
  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character) => {
    const { x, y, width, height, animationFrame } = char;
    
    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 5, GROUND_Y + 55, width - 10, 8);
    
    // 体（明るいピンク）
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x + 8, y + 20, width - 16, height - 30);
    
    // 頭（薄いピンク）
    ctx.fillStyle = '#FFB6C1';
    const headSize = width * 0.8;
    ctx.fillRect(x + (width - headSize) / 2, y - 10, headSize, headSize * 0.8);
    
    // 髪（明るい茶色）
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(x + (width - headSize) / 2, y - 10, headSize, headSize * 0.4);
    
    // 顔の詳細
    ctx.fillStyle = '#000';
    // 目
    const eyeSize = 3;
    ctx.fillRect(x + width * 0.3, y - 5, eyeSize, eyeSize);
    ctx.fillRect(x + width * 0.6, y - 5, eyeSize, eyeSize);
    
    // 口（笑顔）
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x + width * 0.4, y + 5, width * 0.2, 2);
    
    // 腕のアニメーション
    const armOffset = Math.sin(animationFrame * 0.3) * 8;
    ctx.fillStyle = '#FFB6C1';
    // 左腕
    ctx.fillRect(x - 5, y + 25 + armOffset, 8, 20);
    // 右腕
    ctx.fillRect(x + width - 3, y + 25 - armOffset, 8, 20);
    
    // 足のアニメーション
    const legOffset = Math.sin(animationFrame * 0.4) * 6;
    ctx.fillStyle = '#FFB6C1';
    // 左足
    ctx.fillRect(x + 8, y + height - 10 + legOffset, 12, 15);
    // 右足
    ctx.fillRect(x + width - 20, y + height - 10 - legOffset, 12, 15);
    
    // 靴
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 5, y + height + 2 + legOffset, 15, 6);
    ctx.fillRect(x + width - 20, y + height + 2 - legOffset, 15, 6);
  };

  // 障害物の描画
  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const { x, y, width, height, color } = obstacle;
    
    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 5, GROUND_Y + 55, width - 10, 8);
    
    // 障害物本体
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // ハイライト効果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 2, y + 2, width - 4, height / 3);
  };

  // 背景の描画
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // 空のグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB'); // 空色
    gradient.addColorStop(0.7, '#FFE4E1'); // 薄いピンク
    gradient.addColorStop(1, '#90EE90'); // 薄い緑
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 雲
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const cloudX = (i * 200 + 50) % (CANVAS_WIDTH + 100);
      const cloudY = 50 + Math.sin(i) * 20;
      
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 15, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY, 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 地面
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, GROUND_Y + 60, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 60);
    
    // 草
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < CANVAS_WIDTH; i += 15) {
      const grassHeight = 8 + Math.sin(i * 0.1) * 3;
      ctx.fillRect(i, GROUND_Y + 55, 2, grassHeight);
    }
  };

  // UI要素の描画
  const drawUI = useCallback((ctx: CanvasRenderingContext2D) => {
    // スコア表示
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 24px Arial';
    ctx.strokeText(`スコア: ${gameState.score}`, 20, 40);
    ctx.fillText(`スコア: ${gameState.score}`, 20, 40);
    
    // 操作説明
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText('←→: 移動  スペース: ジャンプ', 20, CANVAS_HEIGHT - 20);
    
    // ゲームオーバー画面
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText('ゲームオーバー', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.fillText('ゲームオーバー', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      ctx.font = 'bold 24px Arial';
      ctx.strokeText(`最終スコア: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`最終スコア: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '20px Arial';
      ctx.strokeText('Rキーでリスタート', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.fillText('Rキーでリスタート', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      
      ctx.textAlign = 'left';
    }
    
    // スタート画面
    if (!gameState.gameStarted && !gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText('Wind Runner', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.fillText('Wind Runner', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      ctx.font = '20px Arial';
      ctx.strokeText('スペースキーでゲーム開始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('スペースキーでゲーム開始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.textAlign = 'left';
    }
  }, [gameState]);

  // キャラクターの更新
  const updateCharacter = (char: Character): Character => {
    const newChar = { ...char };
    
    // 横移動の処理
    if (keysPressed.current.has('ArrowLeft')) {
      newChar.velocityX = -PLAYER_SPEED;
    } else if (keysPressed.current.has('ArrowRight')) {
      newChar.velocityX = PLAYER_SPEED;
    } else {
      newChar.velocityX = 0;
    }
    
    // 重力の適用
    if (!newChar.isOnGround) {
      newChar.velocityY += GRAVITY;
    }
    
    // 位置の更新
    newChar.x += newChar.velocityX;
    newChar.y += newChar.velocityY;
    
    // 地面との衝突判定
    if (newChar.y >= GROUND_Y) {
      newChar.y = GROUND_Y;
      newChar.velocityY = 0;
      newChar.isJumping = false;
      newChar.isOnGround = true;
    } else {
      newChar.isOnGround = false;
    }
    
    // 画面端の制限
    if (newChar.x < 0) {
      newChar.x = 0;
    } else if (newChar.x + newChar.width > CANVAS_WIDTH) {
      newChar.x = CANVAS_WIDTH - newChar.width;
    }
    
    // アニメーション更新
    if (Math.abs(newChar.velocityX) > 0 || !newChar.isOnGround) {
      newChar.animationTimer += 1;
      if (newChar.animationTimer >= 3) {
        newChar.animationFrame += 1;
        newChar.animationTimer = 0;
      }
    }
    
    return newChar;
  };

  // 障害物の更新
  const updateObstacles = (obstacles: Obstacle[]): Obstacle[] => {
    return obstacles
      .map(obstacle => ({
        ...obstacle,
        x: obstacle.x - OBSTACLE_SPEED
      }))
      .filter(obstacle => obstacle.x + obstacle.width > 0);
  };

  // 新しい障害物の生成
  const spawnObstacle = (): Obstacle => {
    const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF'];
    const heights = [40, 60, 80];
    const height = heights[Math.floor(Math.random() * heights.length)];
    
    return {
      x: CANVAS_WIDTH,
      y: GROUND_Y + 60 - height,
      width: 30,
      height: height,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  };

  // 衝突判定
  const checkCollision = (char: Character, obstacle: Obstacle): boolean => {
    return (
      char.x < obstacle.x + obstacle.width &&
      char.x + char.width > obstacle.x &&
      char.y < obstacle.y + obstacle.height &&
      char.y + char.height > obstacle.y
    );
  };

  // ジャンプ処理
  const handleJump = useCallback(() => {
    if (gameState.gameOver) return;
    
    if (!gameState.gameStarted) {
      setGameState(prev => ({ ...prev, gameStarted: true }));
      return;
    }
    
    setCharacter(prev => {
      if (prev.isOnGround) {
        return {
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true,
          isOnGround: false
        };
      }
      return prev;
    });
  }, [gameState.gameOver, gameState.gameStarted, JUMP_FORCE]);

  // ゲームリスタート
  const restartGame = useCallback(() => {
    setCharacter({
      x: 100,
      y: 300,
      width: 40,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isOnGround: true,
      animationFrame: 0,
      animationTimer: 0
    });
    setObstacles([]);
    setGameState({
      score: 0,
      gameOver: false,
      gameStarted: false
    });
  }, []);

  // メインゲームループ
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 画面クリア
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 背景描画
    drawBackground(ctx);
    
    if (gameState.gameStarted && !gameState.gameOver) {
      // キャラクター更新
      setCharacter(prevChar => {
        const updatedChar = updateCharacter(prevChar);
        
        // 障害物との衝突判定
        obstacles.forEach(obstacle => {
          if (checkCollision(updatedChar, obstacle)) {
            setGameState(prev => ({ ...prev, gameOver: true }));
          }
        });
        
        return updatedChar;
      });
      
      // 障害物更新
      setObstacles(prevObstacles => {
        let newObstacles = updateObstacles(prevObstacles);
        
        // 新しい障害物の生成
        if (Math.random() < 0.02) {
          newObstacles = [...newObstacles, spawnObstacle()];
        }
        
        return newObstacles;
      });
      
      // スコア更新
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1
      }));
    }
    
    // 障害物描画
    obstacles.forEach(obstacle => {
      drawObstacle(ctx, obstacle);
    });
    
    // キャラクター描画
    drawCharacter(ctx, character);
    
    // UI描画
    drawUI(ctx);
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [character, obstacles, gameState, drawUI]);

  // キーボードイベント処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
      
      if (e.code === 'KeyR' && gameState.gameOver) {
        restartGame();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, restartGame, gameState.gameOver]);

  // ゲーム初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-yellow-200 to-pink-200 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 mb-4">
        <h1 className="text-3xl font-bold text-center mb-4 text-purple-600">
          Wind Runner - 障害物回避ゲーム
        </h1>
        <canvas
          ref={canvasRef}
          className="border-4 border-purple-400 rounded-lg bg-sky-100"
        />
        <div className="mt-4 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold">操作方法:</p>
              <p>← →: 左右移動</p>
              <p>スペース: ジャンプ</p>
            </div>
            <div>
              <p className="font-semibold">ゲーム:</p>
              <p>障害物を避けよう!</p>
              <p>R: リスタート</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}