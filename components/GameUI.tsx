import { Character } from '../types';

interface GameUIProps {
  character: Character;
}

export default function GameUI({ character }: GameUIProps) {
  const healthPercentage = (character.health / character.maxHealth) * 100;

  return (
    <div className="game-header">
      <div className="health">
        <span className="health-label">HEALTH:</span>
        <div className="health-bar">
          <div
            className="health-fill"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <span className="health-value">{character.health}/{character.maxHealth}</span>
      </div>

      <div className="ammo">
        AMMO: <span id="ammo-count">100</span>
      </div>

      <style jsx>{`
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #fff;
          margin-bottom: 20px;
        }

        .health {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .health-label {
          color: #0ff;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }

        .health-bar {
          width: 200px;
          height: 20px;
          border: 2px solid #fff;
          background: #222;
          position: relative;
        }

        .health-fill {
          height: 100%;
          background: linear-gradient(to right, #0f0, #0ff);
          transition: width 0.3s ease;
        }

        .health-value {
          color: #0ff;
          font-family: 'Courier New', monospace;
        }

        .ammo {
          color: #0ff;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}