/**
 * 落下状態の実装
 */

import { Character } from '@/types/game';
import { CharacterStateType, ICharacterInput } from '@/types/character';
import { BaseCharacterState } from './BaseCharacterState';

export class FallingState extends BaseCharacterState {
  public readonly type = CharacterStateType.FALLING;

  public update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null {
    // 水平移動処理
    this.handleHorizontalMovement(character, input, deltaTime);

    // 重力適用
    this.applyGravity(character, deltaTime);
    this.updatePosition(character, deltaTime);

    // 地面に着地した場合
    if (!character.isJumping) {
      return CharacterStateType.LANDING;
    }

    return null;
  }

  public canTransitionTo(newState: CharacterStateType): boolean {
    return [
      CharacterStateType.LANDING
    ].includes(newState);
  }
}