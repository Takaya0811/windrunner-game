/**
 * キャラクターコントローラー
 * ステートパターンによるキャラクター制御
 */

import { Character } from '@/types/game';
import { 
  ICharacterController, 
  ICharacterState, 
  CharacterStateType, 
  ICharacterInput,
  ExtendedCharacter,
  StateChangeListener,
  StateChangeEvent
} from '@/types/character';
import { 
  IdleState, 
  RunningState, 
  JumpingState, 
  FallingState, 
  LandingState 
} from './states';
import { GAME_CONFIG } from '@/utils/constants';

export class CharacterController implements ICharacterController {
  private _character: ExtendedCharacter;
  private _currentState: ICharacterState;
  private states: Map<CharacterStateType, ICharacterState>;
  private listeners: StateChangeListener[] = [];

  constructor(initialCharacter: Character) {
    // 拡張キャラクター情報の初期化
    this._character = {
      ...initialCharacter,
      state: CharacterStateType.IDLE,
      previousState: CharacterStateType.IDLE,
      animation: {
        currentFrame: 0,
        frameTime: 0,
        totalFrames: 8,
        frameRate: 12,
        loop: true,
        finished: false
      },
      physics: {
        velocityX: 0,
        velocityY: 0,
        acceleration: 0.5,
        friction: 0.8,
        maxSpeed: GAME_CONFIG.PLAYER_SPEED,
        grounded: true
      },
      stateChangeTime: 0,
      lastGroundedTime: 0,
      coyoteTime: 0.1 // 100ms
    };

    // 状態クラスの初期化
    this.states = new Map<CharacterStateType, ICharacterState>();
    this.states.set(CharacterStateType.IDLE, new IdleState());
    this.states.set(CharacterStateType.RUNNING, new RunningState());
    this.states.set(CharacterStateType.JUMPING, new JumpingState());
    this.states.set(CharacterStateType.FALLING, new FallingState());
    this.states.set(CharacterStateType.LANDING, new LandingState());

    // 初期状態設定
    this._currentState = this.states.get(CharacterStateType.IDLE)!;
  }

  public get character(): ExtendedCharacter {
    return this._character;
  }

  public get currentState(): ICharacterState {
    return this._currentState;
  }

  /**
   * キャラクターの更新
   */
  public update(input: ICharacterInput, deltaTime: number): void {
    // 現在の状態を更新
    const newStateType = this._currentState.update(this._character, input, deltaTime);
    
    // 状態変更が必要な場合
    if (newStateType && newStateType !== this._character.state) {
      this.setState(newStateType);
    }

    // アニメーション更新
    this.updateAnimation(deltaTime);

    // 物理状態更新
    this.updatePhysics();
  }

  /**
   * 状態変更
   */
  public setState(newState: CharacterStateType, force = false): boolean {
    if (!force && !this._currentState.canTransitionTo(newState)) {
      return false;
    }

    const oldState = this._character.state;
    const newStateInstance = this.states.get(newState);
    
    if (!newStateInstance) {
      console.warn(`Unknown state: ${newState}`);
      return false;
    }

    // 状態変更実行
    this._currentState.exit(this._character);
    this._character.previousState = oldState;
    this._character.state = newState;
    this._character.stateChangeTime = performance.now();
    this._currentState = newStateInstance;
    this._currentState.enter(this._character);

    // リスナーに通知
    this.notifyStateChange({
      from: oldState,
      to: newState,
      character: this._character,
      timestamp: this._character.stateChangeTime
    });

    return true;
  }

  /**
   * ジャンプ可能判定
   */
  public canJump(): boolean {
    const now = performance.now();
    const timeSinceGrounded = (now - this._character.lastGroundedTime) / 1000;
    
    return this._character.physics.grounded || 
           (timeSinceGrounded <= this._character.coyoteTime);
  }

  /**
   * 移動可能判定
   */
  public canMove(): boolean {
    return [
      CharacterStateType.IDLE,
      CharacterStateType.RUNNING,
      CharacterStateType.JUMPING,
      CharacterStateType.FALLING,
      CharacterStateType.LANDING
    ].includes(this._character.state);
  }

  /**
   * 初期状態にリセット
   */
  public resetToInitialState(): void {
    this._character.x = GAME_CONFIG.PLAYER_START_X;
    this._character.y = GAME_CONFIG.PLAYER_START_Y;
    this._character.velocityY = 0;
    this._character.isJumping = false;
    this._character.animationFrame = 0;
    this._character.physics.velocityX = 0;
    this._character.physics.velocityY = 0;
    this._character.physics.grounded = true;
    this._character.lastGroundedTime = performance.now();
    
    this.setState(CharacterStateType.IDLE, true);
  }

  /**
   * 状態変更リスナーを追加
   */
  public addStateChangeListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 状態変更リスナーを削除
   */
  public removeStateChangeListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * アニメーション更新
   */
  private updateAnimation(deltaTime: number): void {
    const animation = this._character.animation;
    animation.frameTime += deltaTime;

    const frameDuration = 1 / animation.frameRate;
    if (animation.frameTime >= frameDuration) {
      animation.frameTime = 0;
      animation.currentFrame++;

      if (animation.currentFrame >= animation.totalFrames) {
        if (animation.loop) {
          animation.currentFrame = 0;
        } else {
          animation.currentFrame = animation.totalFrames - 1;
          animation.finished = true;
        }
      }
    }

    // レガシーサポート
    this._character.animationFrame = animation.currentFrame;
  }

  /**
   * 物理状態更新
   */
  private updatePhysics(): void {
    const physics = this._character.physics;
    
    // 接地判定
    const wasGrounded = physics.grounded;
    physics.grounded = this._character.y >= GAME_CONFIG.GROUND_Y && !this._character.isJumping;
    
    if (physics.grounded && !wasGrounded) {
      this._character.lastGroundedTime = performance.now();
    }

    // 速度をレガシーフィールドに同期
    physics.velocityY = this._character.velocityY;
  }

  /**
   * 状態変更通知
   */
  private notifyStateChange(event: StateChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
}