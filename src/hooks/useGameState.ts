/**
 * ゲーム状態管理を行うカスタムフック
 * 
 * このファイルは、ゲーム全体の状態管理を担当するカスタムフックです。
 * 初心者向け解説：
 * - 「状態管理」とは、ゲーム内のデータ（キャラクター位置、スコアなど）を管理すること
 * - カスタムフックに分離することで、メインコンポーネントがより簡潔になる
 * - 状態変更のロジックを一箇所に集約できるため、バグが減り保守性が向上
 */

import { useState, useRef, useEffect } from 'react';
import { Character, Obstacle, Collectible, Weather, BackgroundInfo } from '@/types/game';
import { GAME_CONFIG, WEATHER_CONFIG, BACKGROUND_CONFIG } from '@/utils/constants';

/**
 * useGameStateのパラメータ型定義
 */
export interface UseGameStateParams {
  keysRef?: React.MutableRefObject<{ [key: string]: boolean }>;
}

/**
 * ゲーム状態の型定義
 */
export interface GameState {
  // キャラクター状態
  character: Character;
  
  // ゲームオブジェクト状態
  obstacles: Obstacle[];
  collectibles: Collectible[];
  
  // ゲーム進行状態
  score: number;
  gameSpeed: number;
  gameOver: boolean;
  gameStarted: boolean;
}

/**
 * ゲーム状態管理カスタムフック
 * 
 * 初心者向け解説：
 * このフックは、ゲームの全ての状態を一箇所で管理します。
 * - 状態の初期化
 * - 状態の更新関数
 * - 最新状態への参照（パフォーマンス最適化用）
 * 
 * @param params - オプションパラメータ
 * @returns ゲーム状態と状態管理関数
 */
export const useGameState = (params?: UseGameStateParams) => {
  const { keysRef } = params || {};
  // キャラクター状態
  const [character, setCharacter] = useState<Character>({
    x: GAME_CONFIG.PLAYER_START_X,
    y: GAME_CONFIG.PLAYER_START_Y,
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    animationFrame: 0,
  });
  
  // ゲームオブジェクト状態
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  
  // ゲーム進行状態
  const [score, setScore] = useState<number>(0);
  const [gameSpeed, setGameSpeed] = useState<number>(GAME_CONFIG.INITIAL_GAME_SPEED);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  
  // 天気状態
  const [weather, setWeather] = useState<Weather>({
    current: 'day',
    next: 'night',
    distance: 0,
    changeDistance: WEATHER_CONFIG.WEATHER_CHANGE_DISTANCE,
    transitionProgress: 0,
    isTransitioning: false,
  });

  // 背景テーマ状態
  const [backgroundInfo, setBackgroundInfo] = useState<BackgroundInfo>({
    current: 'japan',
    distance: 0,
    changeDistance: BACKGROUND_CONFIG.BACKGROUND_CHANGE_DISTANCE,
  });

  // 最新状態のRef（パフォーマンス最適化用）
  const characterRef = useRef<Character | null>(null);
  const scoreRef = useRef<number>(0);
  const gameSpeedRef = useRef<number>(GAME_CONFIG.INITIAL_GAME_SPEED);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const weatherRef = useRef<Weather>({
    current: 'day',
    next: 'night',
    distance: 0,
    changeDistance: WEATHER_CONFIG.WEATHER_CHANGE_DISTANCE,
    transitionProgress: 0,
    isTransitioning: false,
  });
  const backgroundInfoRef = useRef<BackgroundInfo>({
    current: 'japan',
    distance: 0,
    changeDistance: BACKGROUND_CONFIG.BACKGROUND_CHANGE_DISTANCE,
  });

  // 状態変更時にRefを更新（パフォーマンス最適化）
  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    collectiblesRef.current = collectibles;
  }, [collectibles]);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    backgroundInfoRef.current = backgroundInfo;
  }, [backgroundInfo]);

  /**
   * 天気を変更する関数（段階的変更対応）
   */
  const updateWeather = (distance: number) => {
    setWeather(prev => {
      const newDistance = distance;
      const transitionStartDistance = prev.changeDistance - WEATHER_CONFIG.WEATHER_TRANSITION_DISTANCE;
      
      // 天気変更完了
      if (newDistance >= prev.changeDistance) {
        // 次の天気を計算（循環）
        const currentIndex = WEATHER_CONFIG.WEATHER_CYCLE.indexOf(prev.next);
        const nextNextIndex = (currentIndex + 1) % WEATHER_CONFIG.WEATHER_CYCLE.length;
        const nextNextWeather = WEATHER_CONFIG.WEATHER_CYCLE[nextNextIndex];
        
        return {
          current: prev.next,
          next: nextNextWeather,
          distance: newDistance,
          changeDistance: prev.changeDistance + WEATHER_CONFIG.WEATHER_CHANGE_DISTANCE,
          transitionProgress: 0,
          isTransitioning: false,
        };
      }
      
      // 天気変更開始
      if (newDistance >= transitionStartDistance && !prev.isTransitioning) {
        return {
          ...prev,
          distance: newDistance,
          isTransitioning: true,
          transitionProgress: 0,
        };
      }
      
      // 天気変更中
      if (prev.isTransitioning) {
        const progressDistance = newDistance - transitionStartDistance;
        const progress = Math.min(progressDistance / WEATHER_CONFIG.WEATHER_TRANSITION_DISTANCE, 1);
        
        return {
          ...prev,
          distance: newDistance,
          transitionProgress: progress,
        };
      }
      
      // 通常状態
      return {
        ...prev,
        distance: newDistance,
      };
    });
  };

  /**
   * 背景テーマを変更する関数
   */
  const updateBackgroundInfo = (distance: number) => {
    setBackgroundInfo(prev => {
      const newDistance = distance;
      
      // 背景変更完了
      if (newDistance >= prev.changeDistance) {
        // 次の背景テーマを計算（循環）
        const currentIndex = BACKGROUND_CONFIG.BACKGROUND_CYCLE.indexOf(prev.current);
        const nextIndex = (currentIndex + 1) % BACKGROUND_CONFIG.BACKGROUND_CYCLE.length;
        const nextTheme = BACKGROUND_CONFIG.BACKGROUND_CYCLE[nextIndex];
        
        return {
          current: nextTheme,
          distance: newDistance,
          changeDistance: prev.changeDistance + BACKGROUND_CONFIG.BACKGROUND_CHANGE_DISTANCE,
        };
      }
      
      // 通常状態
      return {
        ...prev,
        distance: newDistance,
      };
    });
  };

  /**
   * ゲームを開始する関数
   * 
   * 初心者向け解説：
   * すべての状態を初期値にリセットして、新しいゲームを開始します。
   */
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameSpeed(GAME_CONFIG.INITIAL_GAME_SPEED);
    setObstacles([]);
    setCollectibles([]);
    setCharacter({
      x: GAME_CONFIG.PLAYER_START_X,
      y: GAME_CONFIG.PLAYER_START_Y,
      width: GAME_CONFIG.PLAYER_WIDTH,
      height: GAME_CONFIG.PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      animationFrame: 0,
    });
    
    // 天気状態をリセット
    setWeather({
      current: 'day',
      next: 'night',
      distance: 0,
      changeDistance: WEATHER_CONFIG.WEATHER_CHANGE_DISTANCE,
      transitionProgress: 0,
      isTransitioning: false,
    });
    
    // 背景テーマ状態をリセット
    setBackgroundInfo({
      current: 'japan',
      distance: 0,
      changeDistance: BACKGROUND_CONFIG.BACKGROUND_CHANGE_DISTANCE,
    });
    
    // キー入力状態もリセット
    if (keysRef?.current) {
      Object.keys(keysRef.current).forEach(key => {
        keysRef.current[key] = false;
      });
    }
  };

  /**
   * ゲームを再開始する関数
   */
  const restartGame = () => {
    startGame();
  };

  /**
   * ゲームを停止する関数
   */
  const stopGame = () => {
    setGameStarted(false);
  };

  /**
   * ゲーム終了処理
   */
  const endGame = () => {
    setGameOver(true);
  };

  /**
   * スコアを追加する関数
   * 
   * @param points - 追加するポイント数
   */
  const addScore = (points: number) => {
    setScore(prev => prev + points);
  };

  /**
   * ゲーム状態のリセット関数
   * 
   * 初心者向け解説：
   * 全ての状態を初期値に戻します。デバッグや開発時に便利です。
   */
  const resetGameState = () => {
    setCharacter({
      x: GAME_CONFIG.PLAYER_START_X,
      y: GAME_CONFIG.PLAYER_START_Y,
      width: GAME_CONFIG.PLAYER_WIDTH,
      height: GAME_CONFIG.PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      animationFrame: 0,
    });
    setObstacles([]);
    setCollectibles([]);
    setScore(0);
    setGameSpeed(GAME_CONFIG.INITIAL_GAME_SPEED);
    setGameOver(false);
    setGameStarted(false);
  };

  /**
   * 現在のゲーム状態をまとめたオブジェクト
   */
  const gameState: GameState = {
    character,
    obstacles,
    collectibles,
    score,
    gameSpeed,
    gameOver,
    gameStarted,
  };

  return {
    // 状態値
    gameState,
    character,
    obstacles,
    collectibles,
    score,
    gameSpeed,
    gameOver,
    gameStarted,
    weather,
    backgroundInfo,
    
    // 状態更新関数
    setCharacter,
    setObstacles,
    setCollectibles,
    setScore,
    setGameSpeed,
    setGameOver,
    setGameStarted,
    setWeather,
    setBackgroundInfo,
    
    // 最新状態のRef（パフォーマンス最適化用）
    characterRef,
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    weatherRef,
    backgroundInfoRef,
    
    // ゲーム制御関数
    startGame,
    restartGame,
    stopGame,
    endGame,
    addScore,
    resetGameState,
    updateWeather,
    updateBackgroundInfo,
  };
};