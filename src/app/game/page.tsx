'use client';

import { useRef, useEffect, useState } from 'react';

interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  animationFrame: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus' | 'bird';
}

interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  const [character, setCharacter] = useState<Character>({
    x: 100,
    y: 300,
    width: 40,
    height: 60,
    velocityY: 0,
    isJumping: false,
    animationFrame: 0,
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // キー入力処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keysRef.current[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keysRef.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // キャラクター描画
  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character) => {
    // 体
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(char.x, char.y, char.width, char.height);
    
    // 顔
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(char.x + 5, char.y - 15, 30, 20);
    
    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(char.x + 10, char.y - 10, 5, 5);
    ctx.fillRect(char.x + 20, char.y - 10, 5, 5);
    
    // 髪
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(char.x + 3, char.y - 20, 34, 10);
    
    // 服
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(char.x + 5, char.y + 15, 30, 25);
    
    // 腕
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(char.x - 5, char.y + 15, 8, 20);
    ctx.fillRect(char.x + 37, char.y + 15, 8, 20);
    
    // 足
    ctx.fillStyle = '#654321';
    ctx.fillRect(char.x + 8, char.y + 40, 8, 20);
    ctx.fillRect(char.x + 24, char.y + 40, 8, 20);
  };

  // 障害物描画
  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    if (obstacle.type === 'cactus') {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // サボテンの刺
      ctx.strokeStyle = '#006400';
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
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(obstacle.x + 15, obstacle.y + 10, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 翼
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y + 5);
      ctx.lineTo(obstacle.x + 10, obstacle.y - 5);
      ctx.moveTo(obstacle.x + 30, obstacle.y + 5);
      ctx.lineTo(obstacle.x + 20, obstacle.y - 5);
      ctx.stroke();
    }
  };

  // アイテム描画
  const drawCollectible = (ctx: CanvasRenderingContext2D, collectible: Collectible) => {
    if (!collectible.collected) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(collectible.x + 10, collectible.y + 10, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // 星の形
      ctx.fillStyle = '#FFF';
      ctx.font = '16px Arial';
      ctx.fillText('★', collectible.x + 3, collectible.y + 16);
    }
  };

  // 背景描画
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // 空のグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    // 雲
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 3; i++) {
      const x = (i * 300 + (score * 0.5) % 900) % 900 - 100;
      ctx.beginPath();
      ctx.arc(x, 80 + i * 30, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, 80 + i * 30, 20, 0, Math.PI * 2);
      ctx.arc(x + 45, 80 + i * 30, 25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 地面
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 380, 800, 20);
    
    // 草
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 40; i++) {
      const x = (i * 20 + (score * gameSpeed) % 800) % 800;
      ctx.fillRect(x, 375, 3, 8);
    }
  };

  // 衝突判定
  const checkCollision = (rect1: Character | Collectible, rect2: Obstacle | Collectible) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // ゲームループ
  useEffect(() => {
    const gameLoop = () => {
      if (!gameStarted || gameOver) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // キャラクター更新
      setCharacter(prev => {
        const newChar = { ...prev };
        
        // ジャンプ
        if (keysRef.current['Space'] && !newChar.isJumping) {
          newChar.velocityY = -15;
          newChar.isJumping = true;
        }
        
        // 左右移動
        const moveSpeed = 3;
        if (keysRef.current['ArrowLeft']) {
          newChar.x = Math.max(0, newChar.x - moveSpeed);
        }
        if (keysRef.current['ArrowRight']) {
          newChar.x = Math.min(760 - newChar.width, newChar.x + moveSpeed);
        }
        
        // 重力
        if (newChar.isJumping) {
          newChar.y += newChar.velocityY;
          newChar.velocityY += 0.8;
          
          if (newChar.y >= 300) {
            newChar.y = 300;
            newChar.isJumping = false;
            newChar.velocityY = 0;
          }
        }
        
        newChar.animationFrame += 1;
        return newChar;
      });

      // 障害物生成と更新
      setObstacles(prev => {
        let newObstacles = [...prev];
        
     // 最後の障害物との距離をチェック
     const lastObstacle = newObstacles[newObstacles.length - 1];
     const minDistance = 280; // 最小280ピクセル間隔
        if (Math.random() < 0.012 && (!lastObstacle || (800 - lastObstacle.x) > minDistance)) {
          const type = Math.random() < 0.6? 'cactus' : 'bird';
          newObstacles.push({
            x: 800,
            y: type === 'cactus' ? 330 : 250,
            width: type === 'cactus' ? 20 : 30,
            height: type === 'cactus' ? 50 : 20,
            type: type
          });
        }
        
        // 障害物移動
        newObstacles = newObstacles.map(obs => ({
          ...obs,
          x: obs.x - gameSpeed
        })).filter(obs => obs.x > -50);
        
        return newObstacles;
      });

      // アイテム生成と更新
      setCollectibles(prev => {
        let newCollectibles = [...prev];
        
        if (Math.random() < 0.008) {
          newCollectibles.push({
            x: 800,
            y: 200 + Math.random() * 100,
            width: 20,
            height: 20,
            collected: false
          });
        }
        
        // アイテム移動
        newCollectibles = newCollectibles.map(item => ({
          ...item,
          x: item.x - gameSpeed
        })).filter(item => item.x > -30);
        
        return newCollectibles;
      });

      // スコア更新
      setScore(prev => prev + 1);
      
      // ゲーム速度調整
      setGameSpeed(prev => Math.min(prev + 0.002, 5));

      // 描画
      ctx.clearRect(0, 0, 800, 400);
      drawBackground(ctx);
      drawCharacter(ctx, character);
      obstacles.forEach(obs => drawObstacle(ctx, obs));
      collectibles.forEach(item => drawCollectible(ctx, item));

      // 次のフレーム
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, gameSpeed, score, obstacles, collectibles, character]);

  // 衝突判定
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    obstacles.forEach(obstacle => {
      if (checkCollision(character, obstacle)) {
        setGameOver(true);
      }
    });

    // アイテム収集判定
    setCollectibles(prev => 
      prev.map(item => {
        if (!item.collected && checkCollision(character, item)) {
          setScore(s => s + 50);
          return { ...item, collected: true };
        }
        return item;
      })
    );
  }, [character, obstacles, collectibles, gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameSpeed(2);
    setObstacles([]);
    setCollectibles([]);
    setCharacter({
      x: 100,
      y: 300,
      width: 40,
      height: 60,
      velocityY: 0,
      isJumping: false,
      animationFrame: 0,
    });
    keysRef.current = {};
  };

  const restartGame = () => {
    startGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-400 to-pink-400 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-4">
          🏃‍♂️ Wind Runner Game 🏃‍♂️
        </h1>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold">
            スコア: <span className="text-blue-600">{score}</span>
          </div>
          <div className="text-lg">
            速度: <span className="text-green-600">{gameSpeed.toFixed(1)}</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="border-4 border-gray-300 rounded-lg bg-blue-100 mx-auto block"
        />

        <div className="mt-4 text-center">
          {!gameStarted && !gameOver && (
            <div>
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl mr-4"
              >
                🎮 ゲームスタート
              </button>
            </div>
          )}

          {gameOver && (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
              <h2 className="text-2xl font-bold text-red-600 mb-2">ゲームオーバー!</h2>
              <p className="text-lg mb-4">最終スコア: {score}</p>
              <button
                onClick={restartGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                🔄 もう一度プレイ
              </button>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-4">
            <p><strong>操作方法:</strong></p>
            <p>🚀 スペースキー: ジャンプ</p>
            <p>⬅️➡️ 矢印キー: 左右移動</p>
            <p>⭐ 黄色い星を集めてスコアアップ!</p>
            <p>🌵🐦 サボテンと鳥を避けよう!</p>
          </div>
        </div>
      </div>
    </div>
  );
}