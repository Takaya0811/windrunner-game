/**
 * 着地状態の実装
 */

import { Character } from '@/types/game';
import { CharacterStateType, ICharacterInput } from '@/types/character';
import { BaseCharacterState } from './BaseCharacterState';

export class LandingState extends BaseCharacterState {
  public readonly type = CharacterStateType.LANDING;
  private landingTime = 0;
  private readonly LANDING_DURATION = 0.1; // 100ms

  public enter(character: Character): void {
    this.landingTime = 0;
    character.velocityY = 0;
    character.isJumping = false;
  }

  public update(character: Character, input: ICharacterInput, deltaTime: number): CharacterStateType | null {
    this.landingTime += deltaTime;

    // ジャンプ入力チェック
    if (input.jump) {
      return CharacterStateType.JUMPING;
    }

    // 着地アニメーション完了後
    if (this.landingTime >= this.LANDING_DURATION) {
      if (input.left || input.right) {
        return CharacterStateType.RUNNING;
      } else {
        return CharacterStateType.IDLE;
      }
    }

    // 水平移動は許可
    this.handleHorizontalMovement(character, input, deltaTime);

    return null;
  }

  public canTransitionTo(newState: CharacterStateType): boolean {
    return [
      CharacterStateType.IDLE,
      CharacterStateType.RUNNING,
      CharacterStateType.JUMPING
    ].includes(newState);
  }
}