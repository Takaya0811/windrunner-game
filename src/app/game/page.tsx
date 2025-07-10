'use client';

import { useEffect, useRef, useState } from 'react';

interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  animationFrame: number;
  animationTimer: number;
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [character, setCharacter] = useState<Character>({
    x: 50,
    y: 300,
    width: 40,
    height: 60,
    velocityX: 3,
    velocityY: 0,
    isJumping: false,
    animationFrame: 0,
    animationTimer: 0
  });

  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const GROUND_Y = 300;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;

  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character) => {
    // ��ᨭ�鯿�n�;
    const { x, y, width, height, animationFrame } = char;
    
    // Snr�D��	
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x, y, width, height);
    
    // -���D��	
    ctx.fillStyle = '#FFB6C1';
    const headSize = width * 0.8;
    ctx.fillRect(x + (width - headSize) / 2, y - headSize, headSize, headSize);
    
    // ��D6r	
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(x + (width - headSize) / 2, y - headSize, headSize, headSize * 0.4);
    
    // Tns0
    ctx.fillStyle = '#000';
    // �
    const eyeSize = 3;
    ctx.fillRect(x + width * 0.25, y - headSize + headSize * 0.3, eyeSize, eyeSize);
    ctx.fillRect(x + width * 0.65, y - headSize + headSize * 0.3, eyeSize, eyeSize);
    
    // �
    ctx.fillRect(x + width * 0.4, y - headSize + headSize * 0.6, width * 0.2, 2);
    
    // Un�������pcfD��Fk	
    const armOffset = Math.sin(animationFrame * 0.3) * 10;
    ctx.fillStyle = '#FFB6C1';
    // �U
    ctx.fillRect(x - 8, y + 10 + armOffset, 8, 20);
    // �U
    ctx.fillRect(x + width, y + 10 - armOffset, 8, 20);
    
    // �n�������
    const legOffset = Math.sin(animationFrame * 0.4) * 8;
    ctx.fillStyle = '#FFB6C1';
    // �
    ctx.fillRect(x + 5, y + height - 5 + legOffset, 12, 15);
    // �
    ctx.fillRect(x + width - 17, y + height - 5 - legOffset, 12, 15);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // zn��������DRK���x	
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#FFE4E1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // �
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(150, 80, 20, 0, Math.PI * 2);
    ctx.arc(170, 80, 25, 0, Math.PI * 2);
    ctx.arc(190, 80, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(400, 60, 18, 0, Math.PI * 2);
    ctx.arc(415, 60, 22, 0, Math.PI * 2);
    ctx.arc(430, 60, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // 0b
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, GROUND_Y + 60, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 60);
    
    // I
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, GROUND_Y + 55, 3, 10);
      ctx.fillRect(i + 5, GROUND_Y + 58, 3, 7);
      ctx.fillRect(i + 10, GROUND_Y + 56, 3, 9);
    }
  };

  const updateCharacter = (char: Character): Character => {
    let newChar = { ...char };
    
    // ͛ni(
    newChar.velocityY += GRAVITY;
    newChar.y += newChar.velocityY;
    
    // 0bhn]�$�
    if (newChar.y >= GROUND_Y) {
      newChar.y = GROUND_Y;
      newChar.velocityY = 0;
      newChar.isJumping = false;
    }
    
    // *��
    newChar.x += newChar.velocityX;
    
    // ;b�gn�
    if (newChar.x > CANVAS_WIDTH) {
      newChar.x = -newChar.width;
    }
    
    // �������������
    newChar.animationTimer += 1;
    if (newChar.animationTimer >= 3) {
      newChar.animationFrame += 1;
      newChar.animationTimer = 0;
    }
    
    return newChar;
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // ;b��
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // �o�;
    drawBackground(ctx);
    
    // ��鯿���
    setCharacter(prevChar => {
      const updatedChar = updateCharacter(prevChar);
      // ��鯿��;
      drawCharacter(ctx, updatedChar);
      return updatedChar;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const handleJump = () => {
    if (!character.isJumping) {
      setCharacter(prev => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true
      }));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    // ����ɤ���
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [character.isJumping]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-yellow-200 to-pink-200 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 mb-4">
        <h1 className="text-3xl font-bold text-center mb-4 text-purple-600">
          Wind Runner Game
        </h1>
        <canvas
          ref={canvasRef}
          className="border-4 border-purple-400 rounded-lg cursor-pointer"
          onClick={handleJump}
        />
        <div className="mt-4 text-center">
          <p className="text-lg text-gray-700 mb-2">
            ������K��ïg����
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleJump}
              className="px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors font-semibold"
            >
              ����
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}