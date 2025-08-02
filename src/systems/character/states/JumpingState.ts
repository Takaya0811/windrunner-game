/**
 * ジャンプ状態の実装
 */

import { Character } from '@/types/game';
import { CharacterStateType, ICharacterInput } from '@/types/character';
import { BaseCharacterState } from './BaseCharacterState';
import { GAME_CONFIG } from '@/utils/constants';

export class JumpingState extends BaseCharacterState {
  public readonly type = CharacterStateType.JUMPING;

  public enter(character: Character): void {
    character.velocityY = GAME_CONFIG.JUMP_FORCE;
    character.isJumping = true;
  }

  public update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null {
    // 水平移動処理
    this.handleHorizontalMovement(character, input, deltaTime);

    // 重力適用
    this.applyGravity(character, deltaTime);
    this.updatePosition(character, deltaTime);

    // 頂点を超えて落下開始
    if (character.velocityY > 0) {
      return CharacterStateType.FALLING;
    }

    // 地面に着地した場合
    if (!character.isJumping) {
      if (input.left || input.right) {
        return CharacterStateType.RUNNING;
      } else {
        return CharacterStateType.IDLE;
      }
    }

    return null;
  }

  public canTransitionTo(newState: CharacterStateType): boolean {
    return [
      CharacterStateType.FALLING,
      CharacterStateType.LANDING,
      CharacterStateType.RUNNING,
      CharacterStateType.IDLE
    ].includes(newState);
  }
}