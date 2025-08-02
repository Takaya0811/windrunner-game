/**
 * アイドル状態の実装
 */

import { Character } from '@/types/game';
import { CharacterStateType, ICharacterInput } from '@/types/character';
import { BaseCharacterState } from './BaseCharacterState';

export class IdleState extends BaseCharacterState {
  public readonly type = CharacterStateType.IDLE;

  public enter(character: Character): void {
    character.velocityY = 0;
  }

  public update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null {
    // ジャンプ入力チェック
    if (input.jump && !character.isJumping) {
      return CharacterStateType.JUMPING;
    }

    // 左右移動入力チェック
    if (input.left || input.right) {
      this.handleHorizontalMovement(character, input, deltaTime);
      return CharacterStateType.RUNNING;
    }

    // 重力適用
    this.applyGravity(character, deltaTime);
    this.updatePosition(character, deltaTime);

    // 落下チェック
    if (character.isJumping && character.velocityY > 0) {
      return CharacterStateType.FALLING;
    }

    return null; // 状態変更なし
  }

  public canTransitionTo(newState: CharacterStateType): boolean {
    return [
      CharacterStateType.RUNNING,
      CharacterStateType.JUMPING,
      CharacterStateType.FALLING
    ].includes(newState);
  }
}