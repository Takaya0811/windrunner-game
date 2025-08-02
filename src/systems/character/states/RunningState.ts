/**
 * 走行状態の実装
 */

import { Character } from '@/types/game';
import { CharacterStateType, ICharacterInput } from '@/types/character';
import { BaseCharacterState } from './BaseCharacterState';

export class RunningState extends BaseCharacterState {
  public readonly type = CharacterStateType.RUNNING;

  public update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null {
    // ジャンプ入力チェック
    if (input.jump && !character.isJumping) {
      return CharacterStateType.JUMPING;
    }

    // 移動入力チェック
    if (!input.left && !input.right) {
      return CharacterStateType.IDLE;
    }

    // 水平移動処理
    this.handleHorizontalMovement(character, input, deltaTime);

    // 重力適用
    this.applyGravity(character, deltaTime);
    this.updatePosition(character, deltaTime);

    // 落下チェック
    if (character.isJumping && character.velocityY > 0) {
      return CharacterStateType.FALLING;
    }

    // アニメーションフレーム更新
    character.animationFrame += deltaTime * 60; // 60FPS基準

    return null;
  }

  public canTransitionTo(newState: CharacterStateType): boolean {
    return [
      CharacterStateType.IDLE,
      CharacterStateType.JUMPING,
      CharacterStateType.FALLING
    ].includes(newState);
  }
}