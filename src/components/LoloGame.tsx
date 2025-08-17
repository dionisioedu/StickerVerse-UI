import React, { useEffect, useRef, useState } from "react";

/**
 * Lolo — strict grid movement (no half-steps) and corrected interactions
 * - Container: 13×13 (outer walls). Inner 11×11 playable area.
 * - Movement is tile-based (player always sits on integer grid cells).
 * - Push blocks only by moving into a block when the cell beyond is empty.
 * - Hearts collected open all chests (G). Stepping on an opened chest opens a gate (E)
 *   which turns into an exit tile; stepping into the exit clears the stage.
 * - Medusa zaps in straight line (row/column) if no wall/block between.
 * - Skull wakes after hearts collected and chases the player (orthogonal greedy).
 *
 * ASCII legend (13×13):
 *  W = Wall, B = Block, H = Heart, G = GoalClosed (interactive chest), C = Chest (decorative/impassable),
 *  M = Medusa, K = Skull, S = Snake (static harmless), P = Player, E = Gate (wall that opens),
 *  T = Tree (impassable, blocks sight), . = Empty.
 * Unused: Stone, Water, Bridge (for extension).
 */

// ===== Constants =====
const GRID_W = 13;
const GRID_H = 13;
const CELL = 40;
const CANVAS_W = GRID_W * CELL;
const CANVAS_H = GRID_H * CELL;

// ===== Types =====
type Vec = { x: number; y: number };

enum Tile {
  Empty = 0,
  Wall = 1,
  Block = 2,
  Heart = 3,
  GoalClosed = 4,
  GoalOpen = 5,
  Stone = 6,
  Tree = 7,
  Water = 8,
  Bridge = 9,
  Chest = 10, // Decorative chest (impassable, blocks sight)
}

type Enemy = 
  | { kind: "medusa"; pos: Vec; awake: boolean }
  | { kind: "skull"; pos: Vec; awake: boolean }
  | { kind: "snake"; pos: Vec; awake: boolean };

type Level = {
  name: string;
  grid: Tile[][];
  player: Vec;
  enemies: Enemy[];
  gate: Vec | null;
  gateOpened: boolean;
};

// ===== Utilities =====
const inBounds = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;

const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

function cloneLevel(level: Level): Level {
  return {
    name: level.name,
    grid: level.grid.map((row) => row.slice()),
    player: { ...level.player },
    enemies: level.enemies.map((enemy) => ({ ...enemy, pos: { ...enemy.pos } })),
    gate: level.gate ? { ...level.gate } : null,
    gateOpened: level.gateOpened,
  };
}

function heartsLeft(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile === Tile.Heart) count++;
    }
  }
  return count;
}

function isPassable(tile: Tile): boolean {
  return tile === Tile.Empty || tile === Tile.Heart || tile === Tile.GoalOpen;
  // Extend here for Bridge if needed: || tile === Tile.Bridge
}

function isSightBlocking(tile: Tile): boolean {
  return (
    tile === Tile.Wall ||
    tile === Tile.Block ||
    tile === Tile.Tree ||
    tile === Tile.Stone ||
    tile === Tile.Chest ||
    tile === Tile.GoalClosed
  );
  // Extend for other blockers if added
}

function lineOfSight(grid: Tile[][], a: Vec, b: Vec): boolean {
  if (a.x !== b.x && a.y !== b.y) return false;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  let x = a.x + dx;
  let y = a.y + dy;
  while (x !== b.x || y !== b.y) {
    if (!inBounds(x, y)) return false;
    if (isSightBlocking(grid[y][x])) return false;
    x += dx;
    y += dy;
  }
  return true;
}

function enemyAt(level: Level, x: number, y: number): Enemy | null {
  return level.enemies.find((e) => e.pos.x === x && e.pos.y === y) ?? null;
}

// ===== Level builder =====
function fromAscii(name: string, rows: string[]): Level {
  if (rows.length !== GRID_H || rows.some((r) => r.length !== GRID_W)) {
    throw new Error(`${name} must be ${GRID_W}×${GRID_H}`);
  }
  const grid: Tile[][] = [];
  const enemies: Enemy[] = [];
  let player: Vec = { x: 1, y: 1 };
  let gate: Vec | null = null;
  for (let y = 0; y < GRID_H; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < GRID_W; x++) {
      const ch = rows[y][x];
      switch (ch) {
        case "W":
          row.push(Tile.Wall);
          break;
        case ".":
          row.push(Tile.Empty);
          break;
        case "B":
          row.push(Tile.Block);
          break;
        case "R":
          row.push(Tile.Stone);
          break;
        case "A":
          row.push(Tile.Water);
          break;
        case "D":
          row.push(Tile.Bridge);
          break;
        case "H":
          row.push(Tile.Heart);
          break;
        case "G":
          row.push(Tile.GoalClosed);
          break;
        case "S":
          row.push(Tile.Empty);
          enemies.push({ kind: "snake", pos: { x, y }, awake: false });
          break;
        case "M":
          row.push(Tile.Empty);
          enemies.push({ kind: "medusa", pos: { x, y }, awake: true }); // Medusa always active
          break;
        case "K":
          row.push(Tile.Empty);
          enemies.push({ kind: "skull", pos: { x, y }, awake: false });
          break;
        case "P":
          row.push(Tile.Empty);
          player = { x, y };
          break;
        case "E":
          row.push(Tile.Wall);
          gate = { x, y };
          break;
        case "T":
          row.push(Tile.Tree);
          break;
        case "C":
          row.push(Tile.Chest);
          break;
        default:
          row.push(Tile.Empty);
          break;
      }
    }
    grid.push(row);
  }
  return { name, grid, player, enemies, gate, gateOpened: false };
}

// ===== Example stage (approximate first screen) =====
const LEVELS: Level[] = [
  fromAscii("Stage 1", [
    "WWWWWWWGWWWWW",
    "WRRRRRR.RRTTW",
    "WRTTRH..RRTTW",
    "W.TTRRR.RRRTW",
    "W..TTRR.RRRTW",
    "WP...RR.RRTHW",
    "W......S.R..W",
    "W.TT........W",
    "WTTTT...TT..W",
    "WTTTT...TTT.W",
    "WRTTRC...TT.W",
    "WRRRRRR    .W",
    "WWWWWWWWWWWWW",
  ]),
];

// ===== Main component =====
export default function LoloGrid(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [level, setLevel] = useState<Level>(() => cloneLevel(LEVELS[0]));
  const [message, setMessage] = useState("Collect all hearts to open chests.");

  // Reset/next level
  const resetLevel = (index = levelIndex) => {
    setLevelIndex(index);
    setLevel(cloneLevel(LEVELS[index]));
    setMessage("Collect all hearts to open chests.");
  };

  const nextLevel = () => {
    const nextIndex = (levelIndex + 1) % LEVELS.length;
    resetLevel(nextIndex);
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w") move({ x: 0, y: -1 });
      else if (key === "arrowdown" || key === "s") move({ x: 0, y: 1 });
      else if (key === "arrowleft" || key === "a") move({ x: -1, y: 0 });
      else if (key === "arrowright" || key === "d") move({ x: 1, y: 0 });
      else if (key === "r") resetLevel();
      else if (key === "n") nextLevel();
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [levelIndex, level]); // Dependencies ensure re-bind on level change

  // Mouse/tap input: Step toward clicked cell
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const targetX = Math.floor((event.clientX - rect.left) / CELL);
      const targetY = Math.floor((event.clientY - rect.top) / CELL);
      const dx = targetX - level.player.x;
      const dy = targetY - level.player.y;
      const dir: Vec =
        Math.abs(dx) >= Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) };
      move(dir);
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [level]);

  // Game loop: Draw + enemy tick
  useEffect(() => {
    let animationFrameId = 0;
    let accumulator = 0;
    let lastTime = performance.now();
    const TICK_INTERVAL = 300; // ms for enemy steps

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator += deltaTime;

      if (accumulator >= TICK_INTERVAL) {
        accumulator -= TICK_INTERVAL;
        updateEnemies();
      }

      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [level]);

  // ===== Mechanics =====
  function move(direction: Vec) {
    setLevel((prevLevel) => {
      const currentLevel = cloneLevel(prevLevel);
      const playerX = currentLevel.player.x;
      const playerY = currentLevel.player.y;
      const nextX = playerX + direction.x;
      const nextY = playerY + direction.y;

      if (!inBounds(nextX, nextY)) return prevLevel;

      const targetTile = currentLevel.grid[nextY][nextX];

      // Handle block pushing
      if (targetTile === Tile.Block) {
        const pushX = nextX + direction.x;
        const pushY = nextY + direction.y;
        if (!inBounds(pushX, pushY)) return prevLevel;
        if (currentLevel.grid[pushY][pushX] !== Tile.Empty) return prevLevel;
        if (enemyAt(currentLevel, pushX, pushY)) return prevLevel;

        // Push the block
        currentLevel.grid[pushY][pushX] = Tile.Block;
        currentLevel.grid[nextY][nextX] = Tile.Empty;
        currentLevel.player = { x: nextX, y: nextY };

        const result = afterPlayerMove(currentLevel);
        if (result.died || result.won) return prevLevel;
        return currentLevel;
      }

      // Block movement if not passable or wall
      if (targetTile === Tile.Wall || !isPassable(targetTile)) return prevLevel;

      // Check for enemy collision
      const enemy = enemyAt(currentLevel, nextX, nextY);
      if (enemy) {
        if (enemy.kind === "medusa") {
          setMessage("Stepped onto Medusa! Press R to retry.");
          return prevLevel;
        }
        if (enemy.kind === "skull" && enemy.awake) {
          setMessage("Stepped onto Skull! Press R to retry.");
          return prevLevel;
        }
        // Snakes and dormant skulls are harmless (can step over/through for now)
      }

      // Move player
      currentLevel.player = { x: nextX, y: nextY };

      const result = afterPlayerMove(currentLevel);
      if (result.died || result.won) return prevLevel;
      return currentLevel;
    });
  }

  function updateEnemies() {
    setLevel((prevLevel) => {
      const currentLevel = cloneLevel(prevLevel);
      const playerPos = currentLevel.player;

      for (const enemy of currentLevel.enemies) {
        if (enemy.kind === "skull" && enemy.awake) {
          const dx = playerPos.x - enemy.pos.x;
          const dy = playerPos.y - enemy.pos.y;
          const priorityDirs =
            Math.abs(dx) >= Math.abs(dy)
              ? [{ x: Math.sign(dx), y: 0 }, { x: 0, y: Math.sign(dy) }]
              : [{ x: 0, y: Math.sign(dy) }, { x: Math.sign(dx), y: 0 }];

          for (const dir of priorityDirs) {
            const nextX = enemy.pos.x + dir.x;
            const nextY = enemy.pos.y + dir.y;
            if (!inBounds(nextX, nextY)) continue;
            const targetTile = currentLevel.grid[nextY][nextX];
            if (!isPassable(targetTile)) continue;
            if (enemyAt(currentLevel, nextX, nextY)) continue;

            enemy.pos = { x: nextX, y: nextY };
            break;
          }

          // Check if skull caught player
          if (enemy.pos.x === playerPos.x && enemy.pos.y === playerPos.y) {
            setMessage("You were caught! Press R to retry.");
            return prevLevel;
          }
        }
        // Extend here for other enemy types (e.g., snake rotation animation)
      }

      return currentLevel;
    });
  }

  type MoveResult = { ok?: true; died?: true; won?: true };

  function afterPlayerMove(currentLevel: Level): MoveResult {
    const playerPos = currentLevel.player;

    // Collect heart
    if (currentLevel.grid[playerPos.y][playerPos.x] === Tile.Heart) {
      currentLevel.grid[playerPos.y][playerPos.x] = Tile.Empty;
      if (heartsLeft(currentLevel.grid) === 0) {
        // Open all goals
        for (let y = 0; y < GRID_H; y++) {
          for (let x = 0; x < GRID_W; x++) {
            if (currentLevel.grid[y][x] === Tile.GoalClosed) {
              currentLevel.grid[y][x] = Tile.GoalOpen;
            }
          }
        }
        // Wake skulls
        currentLevel.enemies.forEach((enemy) => {
          if (enemy.kind === "skull") enemy.awake = true;
        });
        setMessage("Chests opened! Step onto a chest to open the gate.");
      }
    }

    // Check Medusa line of sight
    for (const enemy of currentLevel.enemies) {
      if (enemy.kind === "medusa" && enemy.awake) {
        if (lineOfSight(currentLevel.grid, enemy.pos, playerPos)) {
          setMessage("Zapped by Medusa! Press R to retry.");
          return { died: true };
        }
      }
    }

    // Handle stepping on open goal
    if (currentLevel.grid[playerPos.y][playerPos.x] === Tile.GoalOpen) {
      if (currentLevel.gate && !currentLevel.gateOpened) {
        currentLevel.grid[currentLevel.gate.y][currentLevel.gate.x] = Tile.GoalOpen;
        currentLevel.gateOpened = true;
        setMessage("A gate opened in the wall! Go there to clear the stage.");
        return { ok: true };
      }
      if (
        currentLevel.gate &&
        currentLevel.gateOpened &&
        currentLevel.gate.x === playerPos.x &&
        currentLevel.gate.y === playerPos.y
      ) {
        setMessage("Stage cleared! Press N for next.");
        return { won: true };
      }
      if (!currentLevel.gate) {
        setMessage("Stage cleared! Press N for next.");
        return { won: true };
      }
    }

    // Extend here for other interactions (e.g., water drowning: if (tile === Tile.Water) return { died: true };)

    return { ok: true };
  }

  // ===== Rendering =====
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw background (checkerboard)
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#eef6ff" : "#e6f0fb";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // Draw tiles
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const tile = level.grid[y][x];
        const px = x * CELL;
        const py = y * CELL;
        switch (tile) {
          case Tile.Wall:
            ctx.fillStyle = "#47576f";
            drawRoundedRect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 6, true);
            break;
          case Tile.Block:
            ctx.fillStyle = "#8b6f5a";
            drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 6, true);
            break;
          case Tile.Tree:
            ctx.fillStyle = "#6a994e";
            drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
            break;
          case Tile.Stone:
            ctx.fillStyle = "#b0b0b0";
            drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
            break;
          case Tile.Water:
            ctx.fillStyle = "#a2d2ff";
            drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
            break;
          case Tile.Bridge:
            ctx.fillStyle = "#f4a261";
            drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
            break;
          case Tile.Chest:
            drawGoal(ctx, px, py, false);
            break;
          case Tile.Heart:
            drawHeart(ctx, px, py);
            break;
          case Tile.GoalClosed:
            drawGoal(ctx, px, py, false);
            break;
          case Tile.GoalOpen:
            drawGoal(ctx, px, py, true);
            break;
          case Tile.Empty:
            // No draw
            break;
        }
      }
    }

    // Draw enemies
    for (const enemy of level.enemies) {
      const px = enemy.pos.x * CELL;
      const py = enemy.pos.y * CELL;
      if (enemy.kind === "medusa") {
        drawMedusa(ctx, px, py);
      } else if (enemy.kind === "skull") {
        drawSkull(ctx, px, py, enemy.awake);
      } else if (enemy.kind === "snake") {
        drawSnake(ctx, px, py);
      }
    }

    // Draw player
    drawPlayer(ctx, level.player.x * CELL, level.player.y * CELL);

    // Draw grid overlay
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    for (let x = 0; x <= GRID_W; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(CANVAS_W, y * CELL);
      ctx.stroke();
    }
  }

  // ===== UI =====
  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-3 py-4 bg-slate-50">
      <h1 className="text-xl font-bold">Lolo — Grid Movement (13×13 container / 11×11 play)</h1>
      <div className="text-sm opacity-70">Level {levelIndex + 1}: {LEVELS[levelIndex].name}</div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-2xl shadow border border-slate-200 touch-none"
      />

      <div className="text-slate-700 text-sm text-center px-4">
        {message}
        <br />
        Keys: Arrow/WASD • R: restart • N: next
      </div>

      <div className="grid grid-cols-3 gap-2 select-none">
        <button className="px-4 py-2 rounded-xl shadow bg-white" onClick={() => move({ x: 0, y: -1 })}>
          ▲
        </button>
        <div />
        <button className="px-4 py-2 rounded-xl shadow bg-white" onClick={() => move({ x: 0, y: 1 })}>
          ▼
        </button>
        <button className="px-4 py-2 rounded-xl shadow bg-white" onClick={() => move({ x: -1, y: 0 })}>
          ◀
        </button>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl shadow bg-white" onClick={() => resetLevel()}>
            ⟲ Reset
          </button>
          <button className="px-3 py-2 rounded-xl shadow bg-white" onClick={() => nextLevel()}>
            Next ▶
          </button>
        </div>
        <button className="px-4 py-2 rounded-xl shadow bg-white" onClick={() => move({ x: 1, y: 0 })}>
          ▶
        </button>
      </div>

      <footer className="text-xs opacity-60">
        Inner playable area is 11×11 inside the border walls. Put 'E' where you want the gate to open.
      </footer>
    </div>
  );
}

// ===== Drawing helpers =====
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  else ctx.stroke();
}

function drawPlayer(ctx: CanvasRenderingContext2D, px: number, py: number) {
  // Centered without offset shift
  ctx.fillStyle = "#2d7dd2";
  drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 10, true);
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 12, py + 14, 6, 6);
  ctx.fillRect(px + CELL - 18, py + 14, 6, 6);
  ctx.fillStyle = "#222";
  ctx.fillRect(px + 14, py + 16, 2, 2);
  ctx.fillRect(px + CELL - 16, py + 16, 2, 2);
}

function drawHeart(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = "#d62828";
  ctx.beginPath();
  const cx = px + CELL / 2;
  const cy = py + CELL / 2 + 2;
  ctx.moveTo(cx, cy + 8);
  ctx.bezierCurveTo(cx + 14, cy - 6, cx + 6, cy - 12, cx, cy - 2);
  ctx.bezierCurveTo(cx - 6, cy - 12, cx - 14, cy - 6, cx, cy + 8);
  ctx.fill();
}

function drawGoal(ctx: CanvasRenderingContext2D, px: number, py: number, isOpen: boolean) {
  ctx.fillStyle = isOpen ? "#2a9d8f" : "#9ca3af";
  drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
  ctx.fillStyle = "#ffffff88";
  ctx.fillRect(px + 10, py + 10, CELL - 20, CELL - 20);
}

function drawMedusa(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = "#6a994e";
  drawRoundedRect(ctx, px + 6, py + 6, CELL - 12, CELL - 12, 8, true);
  ctx.strokeStyle = "#335c33";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 10, py + 10);
  ctx.lineTo(px + 6, py + 4);
  ctx.moveTo(px + CELL - 10, py + 10);
  ctx.lineTo(px + CELL - 6, py + 4);
  ctx.stroke();
}

function drawSkull(ctx: CanvasRenderingContext2D, px: number, py: number, awake: boolean) {
  ctx.fillStyle = awake ? "#1f2937" : "#6b7280";
  drawRoundedRect(ctx, px + 8, py + 8, CELL - 16, CELL - 16, 6, true);
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 14, py + 16, 6, 6);
  ctx.fillRect(px + CELL - 20, py + 16, 6, 6);
}

function drawSnake(ctx: CanvasRenderingContext2D, px: number, py: number) {
  // Simple example: Orange body with eyes
  ctx.fillStyle = "#f4a261";
  drawRoundedRect(ctx, px + 8, py + 8, CELL - 16, CELL - 16, 6, true);
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 14, py + 16, 6, 6);
  ctx.fillRect(px + CELL - 20, py + 16, 6, 6);
  ctx.fillStyle = "#222";
  ctx.fillRect(px + 16, py + 18, 2, 2);
  ctx.fillRect(px + CELL - 18, py + 18, 2, 2);
}