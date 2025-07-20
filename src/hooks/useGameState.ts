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
import { Character, Obstacle, Collectible } from '@/types/game';
import { GAME_CONFIG } from '@/utils/constants';

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

  // 最新状態のRef（パフォーマンス最適化用）
  const characterRef = useRef<Character | null>(null);
  const scoreRef = useRef<number>(0);
  const gameSpeedRef = useRef<number>(GAME_CONFIG.INITIAL_GAME_SPEED);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);

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
    
    // 状態更新関数
    setCharacter,
    setObstacles,
    setCollectibles,
    setScore,
    setGameSpeed,
    setGameOver,
    setGameStarted,
    
    // 最新状態のRef（パフォーマンス最適化用）
    characterRef,
    scoreRef,
    gameSpeedRef,
    obstaclesRef,
    collectiblesRef,
    
    // ゲーム制御関数
    startGame,
    restartGame,
    stopGame,
    endGame,
    addScore,
    resetGameState,
  };
};