/**
 * キャラクター関連の型定義
 * ステートパターンと拡張可能な設計
 */

import { Character } from './game';

// キャラクターの状態列挙型
export enum CharacterStateType {
  IDLE = 'idle',
  RUNNING = 'running', 
  JUMPING = 'jumping',
  FALLING = 'falling',
  LANDING = 'landing'
}

// キャラクター状態の基底インターフェース
export interface ICharacterState {
  readonly type: CharacterStateType;
  enter(character: Character): void;
  update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null;
  exit(character: Character): void;
  canTransitionTo(newState: CharacterStateType): boolean;
}

// 入力インターフェース
export interface ICharacterInput {
  jump: boolean;
  left: boolean;
  right: boolean;
  deltaTime: number;
}

// アニメーション状態
export interface AnimationState {
  currentFrame: number;
  frameTime: number;
  totalFrames: number;
  frameRate: number;
  loop: boolean;
  finished: boolean;
}

// 物理状態
export interface PhysicsState {
  velocityX: number;
  velocityY: number;
  acceleration: number;
  friction: number;
  maxSpeed: number;
  grounded: boolean;
}

// 拡張キャラクター情報
export interface ExtendedCharacter extends Character {
  state: CharacterStateType;
  previousState: CharacterStateType;
  animation: AnimationState;
  physics: PhysicsState;
  stateChangeTime: number;
  lastGroundedTime: number;
  coyoteTime: number; // コヨーテタイム（地面を離れてからジャンプ可能な時間）
}

// キャラクター管理クラスのインターフェース
export interface ICharacterController {
  readonly character: ExtendedCharacter;
  readonly currentState: ICharacterState;
  
  update(input: ICharacterInput, deltaTime: number): void;
  setState(newState: CharacterStateType, force?: boolean): boolean;
  canJump(): boolean;
  canMove(): boolean;
  resetToInitialState(): void;
}

// 状態変更通知のためのイベント
export interface StateChangeEvent {
  from: CharacterStateType;
  to: CharacterStateType;
  character: ExtendedCharacter;
  timestamp: number;
}

// 状態変更リスナー
export type StateChangeListener = (event: StateChangeEvent) => void;