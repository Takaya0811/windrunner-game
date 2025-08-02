/**
 * キャラクター状態の基底クラス
 * ステートパターンの実装
 */

import { Character } from '@/types/game';
import { ICharacterState, CharacterStateType, ICharacterInput } from '@/types/character';

export abstract class BaseCharacterState implements ICharacterState {
  public abstract readonly type: CharacterStateType;

  /**
   * 状態に入る時の処理
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public enter(_character: Character): void {
    // デフォルト実装（オーバーライド可能）
  }

  /**
   * 状態の更新処理
   * @param character キャラクター
   * @param input 入力
   * @param deltaTime フレーム時間
   * @returns 次の状態（nullの場合は状態変更なし）
   */
  public abstract update(
    character: Character, 
    input: ICharacterInput, 
    deltaTime: number
  ): CharacterStateType | null;

  /**
   * 状態を出る時の処理
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public exit(_character: Character): void {
    // デフォルト実装（オーバーライド可能）
  }

  /**
   * 指定された状態への遷移が可能かどうか
   */
  public abstract canTransitionTo(newState: CharacterStateType): boolean;

  /**
   * 共通のユーティリティメソッド
   */
  protected applyGravity(character: Character, deltaTime: number): void {
    if (character.isJumping) {
      character.velocityY += 0.8 * deltaTime; // 重力
    }
  }

  protected updatePosition(character: Character, deltaTime: number): void {
    character.y += character.velocityY * deltaTime;
    
    // 地面判定
    if (character.y >= 300) { // GAME_CONFIG.GROUND_Y
      character.y = 300;
      character.isJumping = false;
      character.velocityY = 0;
    }
  }

  protected handleHorizontalMovement(character: Character, input: ICharacterInput, deltaTime: number): void {
    const speed = 3; // GAME_CONFIG.PLAYER_SPEED
    
    if (input.left) {
      character.x = Math.max(0, character.x - speed * deltaTime);
    }
    if (input.right) {
      character.x = Math.min(800 - character.width, character.x + speed * deltaTime); // CANVAS_WIDTH
    }
  }
}