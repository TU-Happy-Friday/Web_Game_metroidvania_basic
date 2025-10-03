use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, KeyboardEvent};
use std::f64;

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Game constants
const CANVAS_WIDTH: f64 = 800.0;
const CANVAS_HEIGHT: f64 = 600.0;
const GRAVITY: f64 = 0.8;
const JUMP_STRENGTH: f64 = -15.0;
const MOVE_SPEED: f64 = 5.0;
const TILE_SIZE: f64 = 40.0;

// Vector2 struct for positions
#[derive(Clone, Copy, Debug)]
pub struct Vector2 {
    pub x: f64,
    pub y: f64,
}

// Player struct
#[derive(Debug)]
pub struct Player {
    pub position: Vector2,
    pub velocity: Vector2,
    pub width: f64,
    pub height: f64,
    pub on_ground: bool,
    pub facing_right: bool,
    pub color: &'static str,
}

// Enemy struct
#[derive(Debug)]
pub struct Enemy {
    pub position: Vector2,
    pub velocity: Vector2,
    pub width: f64,
    pub height: f64,
    pub health: i32,
    pub max_health: i32,
    pub color: &'static str,
    pub move_direction: i32,
    pub move_range: f64,
    pub start_x: f64,
}

// Game struct
pub struct Game {
    player: Player,
    enemies: Vec<Enemy>,
    keys: std::collections::HashMap<String, bool>,
    canvas_width: f64,
    canvas_height: f64,
}

// Platform data
#[derive(Debug)]
pub struct Platform {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Default for Vector2 {
    fn default() -> Self {
        Vector2 { x: 0.0, y: 0.0 }
    }
}

impl Default for Player {
    fn default() -> Self {
        Player {
            position: Vector2 { x: 100.0, y: 300.0 },
            velocity: Vector2 { x: 0.0, y: 0.0 },
            width: 32.0,
            height: 48.0,
            on_ground: false,
            facing_right: true,
            color: "#00ffff",
        }
    }
}

impl Game {
    pub fn new() -> Self {
        let mut enemies = Vec::new();

        // Create enemy 1 - patrolling enemy
        enemies.push(Enemy {
            position: Vector2 { x: 400.0, y: 400.0 },
            velocity: Vector2 { x: 2.0, y: 0.0 },
            width: 32.0,
            height: 32.0,
            health: 30,
            max_health: 30,
            color: "#ff6b6b",
            move_direction: 1,
            move_range: 150.0,
            start_x: 400.0,
        });

        // Create enemy 2 - jumping enemy
        enemies.push(Enemy {
            position: Vector2 { x: 600.0, y: 450.0 },
            velocity: Vector2 { x: 1.5, y: 0.0 },
            width: 28.0,
            height: 28.0,
            health: 20,
            max_health: 20,
            color: "#ffd93d",
            move_direction: -1,
            move_range: 100.0,
            start_x: 600.0,
        });

        Game {
            player: Player::default(),
            enemies,
            keys: std::collections::HashMap::new(),
            canvas_width: CANVAS_WIDTH,
            canvas_height: CANVAS_HEIGHT,
        }
    }

    pub fn update(&mut self) {
        self.handle_input();
        self.update_player();
        self.update_enemies();
        self.check_collisions();
    }

    fn handle_input(&mut self) {
        // Reset horizontal velocity
        self.player.velocity.x = 0.0;

        // Horizontal movement
        if self.keys.get("ArrowLeft").unwrap_or(&false) {
            self.player.velocity.x = -MOVE_SPEED;
            self.player.facing_right = false;
        }
        if self.keys.get("ArrowRight").unwrap_or(&false) {
            self.player.velocity.x = MOVE_SPEED;
            self.player.facing_right = true;
        }

        // Jump
        if self.keys.get(" ").unwrap_or(&false) && self.player.on_ground {
            self.player.velocity.y = JUMP_STRENGTH;
            self.player.on_ground = false;
        }
    }

    fn update_player(&mut self) {
        // Apply gravity
        if !self.player.on_ground {
            self.player.velocity.y += GRAVITY;
            // Limit fall speed
            self.player.velocity.y = self.player.velocity.y.min(20.0);
        }

        // Update position
        self.player.position.x += self.player.velocity.x;
        self.player.position.y += self.player.velocity.y;

        // Keep player in bounds
        self.player.position.x = f64::max(0.0, f64::min(self.canvas_width - self.player.width, self.player.position.x));

        // Ground collision
        let ground_level = self.canvas_height - 60.0; // Leave space for ground
        if self.player.position.y + self.player.height >= ground_level {
            self.player.position.y = ground_level - self.player.height;
            self.player.velocity.y = 0.0;
            self.player.on_ground = true;
        }

        // Platform collisions
        self.check_platform_collisions();
    }

    fn check_platform_collisions(&mut self) {
        let platforms = self.get_platforms();

        for platform in &platforms {
            // Check if player is on top of platform
            if self.player.position.x < platform.x + platform.width &&
               self.player.position.x + self.player.width > platform.x &&
               self.player.position.y + self.player.height > platform.y &&
               self.player.position.y + self.player.height < platform.y + platform.height + 10.0 &&
               self.player.velocity.y >= 0.0 {

                self.player.position.y = platform.y - self.player.height;
                self.player.velocity.y = 0.0;
                self.player.on_ground = true;
            }
        }
    }

    fn get_platforms(&self) -> Vec<Platform> {
        vec![
            Platform { x: 200.0, y: 450.0, width: 120.0, height: 20.0 },
            Platform { x: 400.0, y: 350.0, width: 100.0, height: 20.0 },
            Platform { x: 550.0, y: 280.0, width: 150.0, height: 20.0 },
        ]
    }

    fn update_enemies(&mut self) {
        for enemy in &mut self.enemies {
            // Simple patrol AI
            enemy.position.x += enemy.velocity.x * enemy.move_direction as f64;

            // Reverse direction at range limits
            if (enemy.position.x - enemy.start_x).abs() > enemy.move_range {
                enemy.move_direction *= -1;
            }

            // Simple jumping AI for second enemy
            if enemy.color == "#ffd93d" && enemy.on_ground && (enemy.position.x - enemy.start_x).abs() > 30.0 {
                enemy.velocity.y = -10.0;
                enemy.on_ground = false;
            }

            // Apply gravity to enemies
            if !enemy.on_ground {
                enemy.velocity.y += GRAVITY * 0.6; // Less gravity for enemies
            }

            enemy.position.y += enemy.velocity.y;

            // Ground collision for enemies
            let ground_level = self.canvas_height - 60.0;
            if enemy.position.y + enemy.height >= ground_level {
                enemy.position.y = ground_level - enemy.height;
                enemy.velocity.y = 0.0;
                enemy.on_ground = true;
            } else {
                enemy.on_ground = false;
            }
        }
    }

    fn check_collisions(&mut self) {
        // Check player-enemy collisions
        for enemy in &self.enemies {
            if self.check_rect_collision(
                self.player.position.x, self.player.position.y, self.player.width, self.player.height,
                enemy.position.x, enemy.position.y, enemy.width, enemy.height
            ) {
                // Simple collision response - bounce player back
                if self.player.position.x < enemy.position.x {
                    self.player.position.x -= 20.0;
                } else {
                    self.player.position.x += 20.0;
                }
                self.player.velocity.x *= -0.5;
            }
        }
    }

    fn check_rect_collision(&self, x1: f64, y1: f64, w1: f64, h1: f64, x2: f64, y2: f64, w2: f64, h2: f64) -> bool {
        x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
    }

    pub fn render(&self, ctx: &CanvasRenderingContext2d) {
        // Clear canvas
        ctx.clear_rect(0.0, 0.0, self.canvas_width, self.canvas_height);

        // Set background
        ctx.set_fill_style(&"#1a1a2e");
        ctx.fill_rect(0.0, 0.0, self.canvas_width, self.canvas_height);

        // Render ground
        ctx.set_fill_style(&"#16213e");
        ctx.fill_rect(0.0, self.canvas_height - 60.0, self.canvas_width, 60.0);

        // Render platforms
        self.render_platforms(ctx);

        // Render player
        self.render_player(ctx);

        // Render enemies
        self.render_enemies(ctx);

        // Render UI
        self.render_ui(ctx);
    }

    fn render_platforms(&self, ctx: &CanvasRenderingContext2d) {
        ctx.set_fill_style(&"#0f3460");
        for platform in &self.get_platforms() {
            ctx.fill_rect(platform.x, platform.y, platform.width, platform.height);
        }
    }

    fn render_player(&self, ctx: &CanvasRenderingContext2d) {
        ctx.set_fill_style(&self.player.color);
        ctx.fill_rect(
            self.player.position.x,
            self.player.position.y,
            self.player.width,
            self.player.height
        );

        // Draw simple face to show direction
        ctx.set_fill_style(&"#ffffff");
        if self.player.facing_right {
            ctx.fill_rect(self.player.position.x + 20.0, self.player.position.y + 10.0, 4.0, 4.0);
        } else {
            ctx.fill_rect(self.player.position.x + 8.0, self.player.position.y + 10.0, 4.0, 4.0);
        }
    }

    fn render_enemies(&self, ctx: &CanvasRenderingContext2d) {
        for enemy in &self.enemies {
            // Draw enemy body
            ctx.set_fill_style(&enemy.color);
            ctx.fill_rect(
                enemy.position.x,
                enemy.position.y,
                enemy.width,
                enemy.height
            );

            // Draw health bar
            let health_percentage = enemy.health as f64 / enemy.max_health as f64;
            ctx.set_fill_style(&"#333333");
            ctx.fill_rect(enemy.position.x, enemy.position.y - 8.0, enemy.width, 4.0);
            ctx.set_fill_style(&"#00ff00");
            ctx.fill_rect(enemy.position.x, enemy.position.y - 8.0, enemy.width * health_percentage, 4.0);

            // Draw simple eyes
            ctx.set_fill_style(&"#000000");
            ctx.fill_rect(enemy.position.x + 6.0, enemy.position.y + 8.0, 3.0, 3.0);
            ctx.fill_rect(enemy.position.x + enemy.width - 9.0, enemy.position.y + 8.0, 3.0, 3.0);
        }
    }

    fn render_ui(&self, ctx: &CanvasRenderingContext2d) {
        // Draw game title
        ctx.set_fill_style(&"#ffffff");
        ctx.set_font("bold 24px monospace");
        ctx.fill_text("METROIDVANIA", 20.0, 40.0).unwrap();

        // Draw controls
        ctx.set_font("14px monospace");
        ctx.fill_text("Controls: ← → Move | SPACE Jump", 20.0, 65.0);

        // Draw player position
        ctx.fill_text(&format!("Position: ({:.0}, {:.0})", self.player.position.x, self.player.position.y), 20.0, 85.0);
    }
}

// WASM bindings
#[wasm_bindgen]
pub struct GameWrapper {
    game: Game,
}

#[wasm_bindgen]
impl GameWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameWrapper {
        console_error_panic_hook::set_once();
        GameWrapper {
            game: Game::new(),
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self) {
        self.game.update();
    }

    #[wasm_bindgen]
    pub fn render(&self, ctx: &CanvasRenderingContext2d) {
        self.game.render(ctx);
    }

    #[wasm_bindgen]
    pub fn handle_key_down(&mut self, key: &str) {
        self.game.keys.insert(key.to_string(), true);
    }

    #[wasm_bindgen]
    pub fn handle_key_up(&mut self, key: &str) {
        self.game.keys.insert(key.to_string(), false);
    }

    #[wasm_bindgen]
    pub fn get_player_position(&self) -> JsValue {
        JsValue::from_serde(&self.game.player.position).unwrap()
    }
}