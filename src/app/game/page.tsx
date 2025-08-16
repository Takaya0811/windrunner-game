'use client';

import { useRef, useEffect } from 'react';
import { useRunnerGameLoop } from '@/hooks/useRunnerGameLoop';
import { useGameState } from '@/hooks/useGameState';

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // ゲーム状態管理（カスタムフックで最適化）
  const {
    score,
    gameSpeed,
    gameOver,
    gameStarted,
    weather,
    backgroundInfo,
    setCharacter,
    setObstacles,
    setCollectibles,
    setScore,
    setGameSpeed,
    setGameOver,
    updateWeather,
    updateBackgroundInfo,
    characterRef,
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    weatherRef,
    backgroundInfoRef,
    startGame,
    restartGame,
  } = useGameState({ keysRef });

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

  // ランナーゲームループ（キャラクター移動版）
  useRunnerGameLoop({
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
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    weatherRef,
    backgroundInfoRef
  });

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
          <div className="text-lg">
            天気: <span className="text-orange-600">{
              (() => {
                const getCurrentWeatherText = (type: string) => {
                  switch (type) {
                    case 'day': return '昼';
                    case 'night': return '夜';
                    case 'sunny': return '晴れ';
                    case 'rainy': return '雨';
                    default: return type;
                  }
                };
                
                if (weather.isTransitioning) {
                  const progress = Math.round(weather.transitionProgress * 100);
                  return `${getCurrentWeatherText(weather.current)}→${getCurrentWeatherText(weather.next)} (${progress}%)`;
                } else {
                  return getCurrentWeatherText(weather.current);
                }
              })()
            }</span>
          </div>
          <div className="text-lg">
            背景: <span className="text-purple-600">{
              (() => {
                const getBackgroundText = (theme: string) => {
                  switch (theme) {
                    case 'japan': return '日本';
                    case 'china': return '中国';
                    case 'europe': return 'ヨーロッパ';
                    case 'egypt': return 'エジプト';
                    default: return theme;
                  }
                };
                return getBackgroundText(backgroundInfo.current);
              })()
            }</span>
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
            <p>➡️ 右矢印キー: 前進（スコア加算）</p>
            <p>⬅️ 左矢印キー: 後退（スコア加算なし）</p>
            <p>🎯 無入力時: 緩やかな前進ドリフト</p>
            <p>⭐ 黄色い星を集めてスコアアップ!</p>
            <p>🔩🐦🕳️ 金属スパイク、鳥、落とし穴を避けよう!</p>
            <p>💡 落とし穴に落ちると画面下まで落下してゲームオーバー！</p>
          </div>
        </div>
      </div>
    </div>
  );
}