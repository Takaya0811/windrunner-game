'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // ブラウザの標準APIを使用した確実なリダイレクト
    window.location.href = '/game';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-400 to-pink-400">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">
          🏃‍♂️ Wind Runner Game へようこそ！
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          ゲームページに移動しています...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        
        {/* 手動リンクも追加 */}
        <div className="mt-6">
          <a 
            href="/game" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl inline-block"
          >
            🎮 ゲームを開始
          </a>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          自動的に移動しない場合は上のボタンをクリックしてください
        </p>
      </div>
    </div>
  );
}