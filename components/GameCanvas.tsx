import { useEffect, useRef, useState } from 'react';

interface GameCanvasProps {
  onError: (error: string) => void;
}

export default function GameCanvas({ onError }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const animationRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initGame = async () => {
      try {
        if (!canvasRef.current) return;

        // Load WASM module
        const wasmModule = await import('../pkg');

        if (!mounted) return;

        // Initialize game
        const game = new wasmModule.GameWrapper();
        gameRef.current = game;

        // Get canvas context
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set up keyboard controls
        const handleKeyDown = (event: KeyboardEvent) => {
          let key = event.key;

          // Handle special keys
          if (key === ' ') {
            key = ' ';
          } else if (key.startsWith('Arrow')) {
            key = key;
          } else {
            return; // Ignore other keys
          }

          game.handle_key_down(key);
          event.preventDefault();
        };

        const handleKeyUp = (event: KeyboardEvent) => {
          let key = event.key;

          if (key === ' ') {
            key = ' ';
          } else if (key.startsWith('Arrow')) {
            key = key;
          } else {
            return;
          }

          game.handle_key_up(key);
          event.preventDefault();
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown as any);
        window.addEventListener('keyup', handleKeyUp as any);

        // Game loop
        const gameLoop = () => {
          if (!mounted || !gameRef.current) return;

          try {
            game.update();
            game.render(ctx);
            animationRef.current = requestAnimationFrame(gameLoop);
          } catch (error) {
            console.error('Game loop error:', error);
            if (mounted) {
              onError('Game error occurred during gameplay');
            }
          }
        };

        // Start game loop
        setIsLoading(false);
        gameLoop();

        // Cleanup
        return () => {
          mounted = false;
          window.removeEventListener('keydown', handleKeyDown as any);
          window.removeEventListener('keyup', handleKeyUp as any);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        };
      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (mounted) {
          onError('Failed to load game engine. Make sure WASM is properly built.');
        }
      }
    };

    initGame();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onError]);

  if (isLoading) {
    return (
      <div className="canvas-loading">
        <div className="loading-spinner"></div>
        <p>Initializing game engine...</p>
        <style jsx>{`
          .canvas-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 40px;
            color: #00ffff;
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
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="game-canvas"
        tabIndex={0}
        style={{ outline: 'none' }}
      />
      <div className="game-instructions">
        <p><strong>Arrow Keys:</strong> Move left/right</p>
        <p><strong>Spacebar:</strong> Jump</p>
        <p><em>Avoid the enemies and explore the platforms!</em></p>
      </div>
      <style jsx>{`
        .canvas-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .game-canvas {
          border: 2px solid #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          border-radius: 8px;
          background: #1a1a2e;
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