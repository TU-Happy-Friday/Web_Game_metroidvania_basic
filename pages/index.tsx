import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('../components/GameCanvas'), {
  ssr: false,
});

export default function Home() {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setGameLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loadingError) {
    return (
      <div className="error-container">
        <h1>Game Loading Error</h1>
        <p>{loadingError}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #1a1a2e;
            color: white;
            font-family: monospace;
            gap: 20px;
          }
          button {
            background: #00ffff;
            color: #1a1a2e;
            border: none;
            padding: 10px 20px;
            font-family: monospace;
            font-weight: bold;
            cursor: pointer;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="game-title">METROIDVANIA</h1>
        <div className="controls-info">
          <span>← → Move</span>
          <span>SPACE Jump</span>
        </div>
      </header>

      <main className="game-main">
        {!gameLoaded ? (
          <div className="loading-screen">
            <div className="loading-text">Loading Game...</div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        ) : (
          <GameCanvas onError={setLoadingError} />
        )}
      </main>

      <footer className="game-footer">
        <p>WASM-Powered Metroidvania Game</p>
      </footer>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', monospace;
          background: #0f0f1e;
          color: #ffffff;
          overflow: hidden;
        }

        .game-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .game-header {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid #00ffff;
        }

        .game-title {
          color: #00ffff;
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 0 0 20px #00ffff;
          margin-bottom: 10px;
        }

        .controls-info {
          color: #ffffff;
          font-size: 1.2rem;
          display: flex;
          justify-content: center;
          gap: 30px;
        }

        .game-main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
        }

        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px;
        }

        .loading-text {
          color: #00ffff;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .loading-bar {
          width: 300px;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #00ffff;
        }

        .loading-progress {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #0080ff);
          width: 100%;
          animation: loading 1s ease-in-out infinite;
        }

        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .game-footer {
          background: #16213e;
          padding: 15px;
          text-align: center;
          border-top: 1px solid #00ffff;
          color: #888;
        }

        canvas {
          border: 2px solid #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}