type KeyState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  range: number;
  speed: number;
  direction: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  speed: number;
}

export default async function initFallbackEngine() {
  // The fallback engine is pure JavaScript, so no async work is required.
  return Promise.resolve();
}

export class GameWrapper {
  private player = {
    x: 100,
    y: 420,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
  };

  private keys: KeyState = {
    left: false,
    right: false,
    jump: false,
  };

  private readonly gravity = 0.75;
  private readonly moveSpeed = 4;
  private readonly jumpStrength = -14;
  private readonly friction = 0.8;

  private readonly platforms: Platform[] = [
    { x: 0, y: 560, width: 800, height: 40 },
    { x: 60, y: 470, width: 180, height: 18 },
    { x: 320, y: 500, width: 140, height: 18 },
    { x: 520, y: 440, width: 160, height: 18 },
    { x: 220, y: 380, width: 180, height: 18 },
    { x: 40, y: 320, width: 140, height: 18 },
    { x: 420, y: 300, width: 160, height: 18 },
    { x: 640, y: 360, width: 120, height: 18 },
  ];

  private readonly enemies: Enemy[] = [
    { x: 380, y: 520, width: 38, height: 38, originX: 380, range: 80, speed: 1.2, direction: 1 },
    { x: 540, y: 410, width: 32, height: 32, originX: 540, range: 60, speed: 1.6, direction: -1 },
    { x: 220, y: 350, width: 32, height: 32, originX: 220, range: 90, speed: 1.1, direction: 1 },
  ];

  private readonly stars: Star[] = Array.from({ length: 40 }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 600,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.3 + 0.1,
  }));

  private tick = 0;
  private hurtTimer = 0;

  handle_key_down(key: string) {
    if (key === 'ArrowLeft') {
      this.keys.left = true;
    } else if (key === 'ArrowRight') {
      this.keys.right = true;
    } else if (key === ' ' || key === 'Spacebar') {
      this.keys.jump = true;
    }
  }

  handle_key_up(key: string) {
    if (key === 'ArrowLeft') {
      this.keys.left = false;
    } else if (key === 'ArrowRight') {
      this.keys.right = false;
    } else if (key === ' ' || key === 'Spacebar') {
      this.keys.jump = false;
    }
  }

  update() {
    this.tick += 1;

    // Starfield parallax effect
    this.stars.forEach((star) => {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = 800 + Math.random() * 40;
        star.y = Math.random() * 600;
      }
    });

    // Horizontal movement
    if (this.keys.left) {
      this.player.velocityX = -this.moveSpeed;
    } else if (this.keys.right) {
      this.player.velocityX = this.moveSpeed;
    } else {
      this.player.velocityX *= this.friction;
      if (Math.abs(this.player.velocityX) < 0.01) {
        this.player.velocityX = 0;
      }
    }

    // Jumping
    if (this.keys.jump && this.player.onGround) {
      this.player.velocityY = this.jumpStrength;
      this.player.onGround = false;
    }

    // Apply gravity
    this.player.velocityY += this.gravity;

    // Update position with simple axis separation
    this.player.x += this.player.velocityX;
    this.resolveCollisions('x');

    this.player.y += this.player.velocityY;
    this.player.onGround = false;
    this.resolveCollisions('y');

    // Move enemies along patrol paths
    this.enemies.forEach((enemy) => {
      enemy.x += enemy.speed * enemy.direction;
      if (Math.abs(enemy.x - enemy.originX) > enemy.range) {
        enemy.direction *= -1;
      }
    });

    // Hurt flash timer
    if (this.hurtTimer > 0) {
      this.hurtTimer -= 1;
    }

    // Enemy collision detection
    for (const enemy of this.enemies) {
      if (this.isColliding(this.player, enemy)) {
        this.hurtTimer = 20;
        // Push player back slightly on hit
        this.player.velocityX = enemy.direction * 6;
        this.player.velocityY = -6;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0b0b1a');
    gradient.addColorStop(1, '#131336');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Draw parallax stars
    ctx.fillStyle = '#00ffff';
    this.stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw platforms
    ctx.fillStyle = '#1f4068';
    this.platforms.forEach((platform) => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw enemies
    ctx.fillStyle = '#ff4f6d';
    this.enemies.forEach((enemy) => {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw player
    ctx.save();
    if (this.hurtTimer > 0 && this.tick % 4 < 2) {
      ctx.globalAlpha = 0.4;
    }
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    ctx.restore();

    // UI overlay
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('JavaScript fallback engine active', 20, 30);
    ctx.fillText('Reach the glowing platform!', 20, 52);

    // Draw glowing goal platform
    const goal = this.platforms[this.platforms.length - 1];
    const pulse = (Math.sin(this.tick / 10) + 1) / 2;
    ctx.fillStyle = `rgba(0, 255, 200, ${0.4 + pulse * 0.4})`;
    ctx.fillRect(goal.x, goal.y - 6, goal.width, 6);
  }

  private resolveCollisions(axis: 'x' | 'y') {
    for (const platform of this.platforms) {
      if (!this.isColliding(this.player, platform)) {
        continue;
      }

      if (axis === 'x') {
        if (this.player.velocityX > 0) {
          this.player.x = platform.x - this.player.width;
        } else if (this.player.velocityX < 0) {
          this.player.x = platform.x + platform.width;
        }
        this.player.velocityX = 0;
      } else {
        if (this.player.velocityY > 0) {
          this.player.y = platform.y - this.player.height;
          this.player.velocityY = 0;
          this.player.onGround = true;
        } else if (this.player.velocityY < 0) {
          this.player.y = platform.y + platform.height;
          this.player.velocityY = 0;
        }
      }
    }

    // Keep player inside bounds
    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.velocityX = 0;
    } else if (this.player.x + this.player.width > 800) {
      this.player.x = 800 - this.player.width;
      this.player.velocityX = 0;
    }

    if (this.player.y + this.player.height > 600) {
      this.player.y = 600 - this.player.height;
      this.player.velocityY = 0;
      this.player.onGround = true;
    }
  }

  private isColliding(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
