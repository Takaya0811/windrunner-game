/**
 * 独立したアニメーション制御システム
 * キャラクターとオブジェクトのアニメーションを統一管理
 */

import { CharacterStateType } from '@/types/character';
import { ANIMATION } from '@/utils/constants';

// アニメーションクリップの定義
export interface AnimationClip {
  name: string;
  frames: number[];
  frameRate: number;
  loop: boolean;
  duration?: number;
}

// アニメーション状態
export interface AnimationInstance {
  clip: AnimationClip;
  currentFrame: number;
  frameTime: number;
  totalTime: number;
  speed: number;
  paused: boolean;
  finished: boolean;
}

// イージング関数
export type EasingFunction = (t: number) => number;

// アニメーション補間タイプ
export enum InterpolationType {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic'
}

// トゥイーンアニメーション
export interface TweenAnimation {
  id: string;
  target: Record<string, unknown>;
  property: string;
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  easing: EasingFunction;
  onComplete?: () => void;
  onUpdate?: (value: number) => void;
}

export class AnimationController {
  private animations = new Map<string, AnimationInstance>();
  private tweens = new Map<string, TweenAnimation>();
  private clips = new Map<string, AnimationClip>();
  private nextTweenId = 0;

  constructor() {
    this.initializeClips();
  }

  /**
   * 標準アニメーションクリップの初期化
   */
  private initializeClips(): void {
    // キャラクター走行アニメーション
    this.registerClip({
      name: 'character_run',
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: ANIMATION.RUN_CYCLE_FRAMES,
      loop: true
    });

    // キャラクターアイドルアニメーション
    this.registerClip({
      name: 'character_idle',
      frames: [0, 1, 2, 1],
      frameRate: 2,
      loop: true
    });

    // ジャンプアニメーション
    this.registerClip({
      name: 'character_jump',
      frames: [0, 1, 2],
      frameRate: 8,
      loop: false
    });

    // 落下アニメーション
    this.registerClip({
      name: 'character_fall',
      frames: [2, 3],
      frameRate: 4,
      loop: true
    });

    // 着地アニメーション
    this.registerClip({
      name: 'character_land',
      frames: [4, 5, 0],
      frameRate: 12,
      loop: false
    });

    // 鳥のアニメーション
    this.registerClip({
      name: 'bird_fly',
      frames: [0, 1, 2, 1],
      frameRate: 6,
      loop: true
    });

    // アイテム収集エフェクト
    this.registerClip({
      name: 'collectible_pickup',
      frames: [0, 1, 2, 3, 4],
      frameRate: 20,
      loop: false
    });
  }

  /**
   * アニメーションクリップを登録
   */
  public registerClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
  }

  /**
   * アニメーションを開始
   */
  public playAnimation(id: string, clipName: string, speed = 1.0): boolean {
    const clip = this.clips.get(clipName);
    if (!clip) {
      console.warn(`Animation clip not found: ${clipName}`);
      return false;
    }

    const instance: AnimationInstance = {
      clip: { ...clip },
      currentFrame: 0,
      frameTime: 0,
      totalTime: 0,
      speed,
      paused: false,
      finished: false
    };

    this.animations.set(id, instance);
    return true;
  }

  /**
   * アニメーションを停止
   */
  public stopAnimation(id: string): void {
    this.animations.delete(id);
  }

  /**
   * アニメーションを一時停止/再開
   */
  public pauseAnimation(id: string, paused: boolean): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.paused = paused;
    }
  }

  /**
   * アニメーション速度を設定
   */
  public setAnimationSpeed(id: string, speed: number): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.speed = speed;
    }
  }

  /**
   * 現在のフレーム番号を取得
   */
  public getCurrentFrame(id: string): number {
    const animation = this.animations.get(id);
    if (!animation) return 0;
    
    return animation.clip.frames[animation.currentFrame] || 0;
  }

  /**
   * アニメーション完了状態を取得
   */
  public isAnimationFinished(id: string): boolean {
    const animation = this.animations.get(id);
    return animation?.finished ?? true;
  }

  /**
   * キャラクター状態に基づくアニメーション選択
   */
  public getCharacterAnimationName(state: CharacterStateType): string {
    switch (state) {
      case CharacterStateType.IDLE:
        return 'character_idle';
      case CharacterStateType.RUNNING:
        return 'character_run';
      case CharacterStateType.JUMPING:
        return 'character_jump';
      case CharacterStateType.FALLING:
        return 'character_fall';
      case CharacterStateType.LANDING:
        return 'character_land';
      default:
        return 'character_idle';
    }
  }

  /**
   * トゥイーンアニメーションを作成
   */
  public createTween(
    target: Record<string, unknown>,
    property: string,
    to: number,
    duration: number,
    easing: InterpolationType = InterpolationType.LINEAR,
    onComplete?: () => void
  ): string {
    const id = `tween_${this.nextTweenId++}`;
    const from = (target[property] as number) || 0;
    
    const tween: TweenAnimation = {
      id,
      target,
      property,
      from,
      to,
      duration,
      elapsed: 0,
      easing: this.getEasingFunction(easing),
      onComplete
    };

    this.tweens.set(id, tween);
    return id;
  }

  /**
   * トゥイーンアニメーションを削除
   */
  public removeTween(id: string): void {
    this.tweens.delete(id);
  }

  /**
   * 全アニメーションを更新
   */
  public update(deltaTime: number): void {
    this.updateFrameAnimations(deltaTime);
    this.updateTweenAnimations(deltaTime);
  }

  /**
   * フレームアニメーションの更新
   */
  private updateFrameAnimations(deltaTime: number): void {
    for (const [, animation] of this.animations) {
      if (animation.paused || animation.finished) continue;

      animation.frameTime += deltaTime * animation.speed;
      animation.totalTime += deltaTime * animation.speed;

      const frameDuration = 1 / animation.clip.frameRate;
      
      if (animation.frameTime >= frameDuration) {
        animation.frameTime = 0;
        animation.currentFrame++;

        if (animation.currentFrame >= animation.clip.frames.length) {
          if (animation.clip.loop) {
            animation.currentFrame = 0;
          } else {
            animation.currentFrame = animation.clip.frames.length - 1;
            animation.finished = true;
          }
        }
      }
    }
  }

  /**
   * トゥイーンアニメーションの更新
   */
  private updateTweenAnimations(deltaTime: number): void {
    const completedTweens: string[] = [];

    for (const [id, tween] of this.tweens) {
      tween.elapsed += deltaTime;
      const progress = Math.min(tween.elapsed / tween.duration, 1);
      const easedProgress = tween.easing(progress);
      
      const value = tween.from + (tween.to - tween.from) * easedProgress;
      (tween.target as Record<string, number>)[tween.property] = value;

      if (tween.onUpdate) {
        tween.onUpdate(value);
      }

      if (progress >= 1) {
        completedTweens.push(id);
        if (tween.onComplete) {
          tween.onComplete();
        }
      }
    }

    // 完了したトゥイーンを削除
    completedTweens.forEach(tweenId => this.tweens.delete(tweenId));
  }

  /**
   * イージング関数を取得
   */
  private getEasingFunction(type: InterpolationType): EasingFunction {
    switch (type) {
      case InterpolationType.LINEAR:
        return (t: number) => t;
      
      case InterpolationType.EASE_IN:
        return (t: number) => t * t;
      
      case InterpolationType.EASE_OUT:
        return (t: number) => 1 - (1 - t) * (1 - t);
      
      case InterpolationType.EASE_IN_OUT:
        return (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      case InterpolationType.BOUNCE:
        return (t: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
      
      case InterpolationType.ELASTIC:
        return (t: number) => {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        };
      
      default:
        return (t: number) => t;
    }
  }

  /**
   * 全アニメーションをクリア
   */
  public clear(): void {
    this.animations.clear();
    this.tweens.clear();
  }

  /**
   * デバッグ情報を取得
   */
  public getDebugInfo(): { 
    animations: Array<{ id: string; clip: string; frame: number; finished: boolean }>; 
    tweens: Array<{ id: string; property: string; progress: number }> 
  } {
    return {
      animations: Array.from(this.animations.entries()).map(([id, anim]) => ({
        id,
        clip: anim.clip.name,
        frame: anim.currentFrame,
        finished: anim.finished
      })),
      tweens: Array.from(this.tweens.entries()).map(([id, tween]) => ({
        id,
        property: tween.property,
        progress: tween.elapsed / tween.duration
      }))
    };
  }
}