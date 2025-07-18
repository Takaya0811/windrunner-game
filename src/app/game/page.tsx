'use client';

import { useRef, useEffect, useState } from 'react';
import { Character, Obstacle, Collectible } from '@/types/game';
import { GAME_CONFIG } from '@/utils/constants';
import { drawCharacter, drawObstacle, drawCollectible, drawBackground } from '@/utils/drawing';
import { checkCharacterObstacleCollision, checkCharacterCollectibleCollision } from '@/utils/collision';

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  const [character, setCharacter] = useState<Character>({
    x: GAME_CONFIG.PLAYER_START_X,
    y: GAME_CONFIG.PLAYER_START_Y,
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    animationFrame: 0,
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(GAME_CONFIG.INITIAL_GAME_SPEED);
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
  }, [])






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
      setGameSpeed(prev => Math.min(prev + GAME_CONFIG.SPEED_INCREASE, GAME_CONFIG.MAX_GAME_SPEED));

      // 描画
      ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      drawBackground(ctx, score, gameSpeed);
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
      if (checkCharacterObstacleCollision(character, obstacle)) {
        setGameOver(true);
      }
    });

    // アイテム収集判定
    setCollectibles(prev => 
      prev.map(item => {
        if (!item.collected && checkCharacterCollectibleCollision(character, item)) {
          setScore(s => s + GAME_CONFIG.COLLECTIBLE_SCORE);
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