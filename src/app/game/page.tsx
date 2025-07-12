'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 自動的に/gameページにリダイレクト
    router.push('/game');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-400 to-pink-400">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">
          🏃‍♂️ Wind Runner Game へようこそ！
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          ゲームページに移動しています...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">
          自動的に移動しない場合は
          <a href="/game" className="text-blue-500 hover:underline ml-1">
            こちらをクリック
          </a>
        </p>
      </div>
    </div>
  );
}