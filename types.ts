// Game type definitions
export interface Character {
  health: number;
  maxHealth: number;
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
  isJumping: boolean;
  isOnGround: boolean;
}

export interface GameState {
  character: Character;
  enemies: Enemy[];
  platforms: Platform[];
  score: number;
  level: number;
}

export interface Enemy {
  id: string;
  position: {
    x: number;
    y: number;
  };
  health: number;
  type: string;
}

export interface Platform {
  id: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'hazard';
}