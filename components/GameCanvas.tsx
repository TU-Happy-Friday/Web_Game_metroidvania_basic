import { useEffect, useRef, useState } from 'react';

interface GameCanvasProps {
  onError: (error: string) => void;
}

export default function GameCanvas({ onError }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>('Initializing game engine...');

  useEffect(() => {
    let mounted = true;
    let detachListeners: (() => void) | undefined;

    const attachGame = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !mounted) {
        return;
      }

      try {
        setStatusMessage('Loading WASM module...');
        let gameModule: any;
        try {
          gameModule = await import('../pkg/metroidvania_wasm.js');
          if (typeof gameModule.default === 'function') {
            await gameModule.default();
          }

          if (!gameModule?.GameWrapper) {
            throw new Error('GameWrapper not found in WASM module');
          }
        } catch (wasmError) {
          console.warn('WASM module unavailable. Falling back to JS engine.', wasmError);
          setStatusMessage('Using JavaScript fallback engine...');
          gameModule = await import('../lib/fallbackGame');
          if (typeof gameModule.default === 'function') {
            await gameModule.default();
          }

          if (!gameModule?.GameWrapper) {
            throw new Error('Fallback game module is missing GameWrapper');
          }
        }

        if (!mounted) {
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        const game = new gameModule.GameWrapper();
        gameRef.current = game;

        const handleKeyDown = (event: KeyboardEvent) => {
          const key = event.key === ' ' ? ' ' : event.key;
          if (key === ' ' || key.startsWith('Arrow')) {
            game.handle_key_down(key);
            event.preventDefault();
          }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
          const key = event.key === ' ' ? ' ' : event.key;
          if (key === ' ' || key.startsWith('Arrow')) {
            game.handle_key_up(key);
            event.preventDefault();
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        detachListeners = () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
        };

        const gameLoop = () => {
          if (!mounted || !gameRef.current) {
            return;
          }

          try {
            game.update();
            game.render(ctx);
            animationRef.current = requestAnimationFrame(gameLoop);
          } catch (loopError) {
            console.error('Game loop error:', loopError);
            if (mounted) {
              onError('Game error occurred during gameplay');
              setIsLoading(false);
              setStatusMessage(null);
            }
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
            }
            if (detachListeners) {
              detachListeners();
              detachListeners = undefined;
            }
            gameRef.current = null;
          }
        };

        setIsLoading(false);
        setStatusMessage(null);
        canvas.focus();
        gameLoop();
      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (mounted) {
          onError('Failed to load game engine. Make sure WASM is properly built.');
          setIsLoading(false);
        }
      }
    };

    attachGame();

    return () => {
      mounted = false;
      if (detachListeners) {
        detachListeners();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gameRef.current = null;
    };
  }, [onError]);

  return (
    <div className="canvas-container">
      {isLoading && statusMessage && (
        <div className="canvas-loading">
          <div className="loading-spinner" />
          <p>{statusMessage}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={`game-canvas${isLoading ? ' is-loading' : ''}`}
        tabIndex={0}
        style={{ outline: 'none' }}
      />

      <div className="game-instructions">
        <p>
          <strong>Arrow Keys:</strong> Move left/right
        </p>
        <p>
          <strong>Spacebar:</strong> Jump
        </p>
        <p>
          <em>Avoid the enemies and explore the platforms!</em>
        </p>
      </div>

      <style jsx>{`
        .canvas-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          position: relative;
        }

        .canvas-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
          color: #00ffff;
          background: rgba(15, 15, 30, 0.85);
          border-radius: 8px;
          z-index: 2;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #00ffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .game-canvas {
          border: 2px solid #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          border-radius: 8px;
          background: #1a1a2e;
        }

        .game-canvas.is-loading {
          visibility: hidden;
        }

        .game-instructions {
          background: rgba(26, 26, 46, 0.8);
          padding: 15px 25px;
          border-radius: 8px;
          border: 1px solid #00ffff;
          text-align: center;
          max-width: 600px;
        }

        .game-instructions p {
          margin: 5px 0;
          color: #ffffff;
        }

        .game-instructions strong {
          color: #00ffff;
        }

        .game-instructions em {
          color: #888;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}
