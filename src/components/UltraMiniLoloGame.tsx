import React, { useEffect, useRef } from 'react';

const EnhancedLoloGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!canvas) return;

    const tileSize = 33; // 11x11 grid, 363x363px canvas
    const gridSize = 11;
    const halfTile = tileSize / 2;

    // Game state
    let lolo = { x: 0, y: 0, shots: 0 }; // Lolo: position and Magic Shots
    let hearts = [
      { x: 2, y: 2 },
      { x: 8, y: 8 },
    ]; // Two hearts for simplicity
    let chest = { x: 10, y: 10, open: false }; // Chest, locked until hearts collected
    let gate = { x: 10, y: 0, hasKey: false }; // Gate, needs key
    let enemy = { x: 5, y: 5, state: 'normal' as 'normal' | 'egg' | 'gone', eggTimer: 0 }; // One enemy
    let lastShotTime = 0; // Track shot cooldown

    // Static level layout (11x11)
    const level: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill('brown'));
    level[3][3] = 'stone';
    level[4][4] = 'stone';
    level[7][7] = 'tree';
    level[8][7] = 'tree';

    // Draw game
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid and tiles
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          ctx.strokeStyle = '#000';
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
          if (level[y][x] === 'brown') {
            ctx.fillStyle = 'brown';
            ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
          } else if (level[y][x] === 'stone') {
            ctx.fillStyle = 'gray';
            ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
          } else if (level[y][x] === 'tree') {
            ctx.fillStyle = 'green';
            ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
          }
        }
      }

      // Draw Lolo (blue square)
      ctx.fillStyle = 'blue';
      ctx.fillRect(lolo.x * tileSize + 5, lolo.y * tileSize + 5, tileSize - 10, tileSize - 10);

      // Draw Hearts (pink circles)
      hearts.forEach(heart => {
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        ctx.arc(heart.x * tileSize + tileSize / 2, heart.y * tileSize + tileSize / 2, tileSize / 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw Chest (yellow square)
      ctx.fillStyle = chest.open ? 'gold' : 'yellow';
      ctx.fillRect(chest.x * tileSize + 5, chest.y * tileSize + 5, tileSize - 10, tileSize - 10);

      // Draw Gate (green square)
      ctx.fillStyle = gate.hasKey ? 'lime' : 'green';
      ctx.fillRect(gate.x * tileSize + 5, gate.y * tileSize + 5, tileSize - 10, tileSize - 10);

      // Draw Enemy (red square, white for egg, gone if removed)
      if (enemy.state !== 'gone') {
        ctx.fillStyle = enemy.state === 'egg' ? 'white' : 'red';
        ctx.fillRect(enemy.x * tileSize + 5, enemy.y * tileSize + 5, tileSize - 10, tileSize - 10);
      }

      // Draw shots count
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.fillText(`Shots: ${lolo.shots}`, 10, canvas.height - 10);
    };

    // Handle enemy egg timer
    const updateEnemy = () => {
      if (enemy.state === 'egg' && enemy.eggTimer > 0) {
        enemy.eggTimer -= 16; // Approx 60fps (16ms per frame)
        if (enemy.eggTimer <= 0) {
          enemy.state = 'normal';
        }
      }
    };

    // Check if position is walkable
    const isWalkable = (x: number, y: number) => {
      const gridX = Math.floor(x);
      const gridY = Math.floor(y);
      if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return false;
      if (level[gridY][gridX] === 'stone' || level[gridY][gridX] === 'tree') return false;
      if (gridX === enemy.x && gridY === enemy.y && enemy.state !== 'gone') return false;
      return true;
    };

    // Handle movement and shooting
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && isWalkable(lolo.x - 0.5, lolo.y)) lolo.x -= 0.5;
      if (e.key === 'ArrowRight' && isWalkable(lolo.x + 0.5, lolo.y)) lolo.x += 0.5;
      if (e.key === 'ArrowUp' && isWalkable(lolo.x, lolo.y - 0.5)) lolo.y -= 0.5;
      if (e.key === 'ArrowDown' && isWalkable(lolo.x, lolo.y + 0.5)) lolo.y += 0.5;

      // Shooting (Spacebar)
      if (e.key === ' ' && lolo.shots > 0 && Date.now() - lastShotTime > 500) {
        lastShotTime = Date.now();
        const gridX = Math.floor(lolo.x);
        const gridY = Math.floor(lolo.y);
        if (gridX === enemy.x && gridY === enemy.y && enemy.state !== 'gone') {
          lolo.shots--;
          if (enemy.state === 'normal') {
            enemy.state = 'egg';
            enemy.eggTimer = 5000; // 5 seconds
          } else if (enemy.state === 'egg') {
            enemy.state = 'gone';
          }
        }
      }

      // Check for heart collection
      hearts = hearts.filter(heart => {
        const gridX = Math.floor(lolo.x);
        const gridY = Math.floor(lolo.y);
        if (gridX === heart.x && gridY === heart.y) {
          lolo.shots = Math.min(lolo.shots + 1, 2); // Max 2 shots
          return false; // Remove heart
        }
        return true;
      });

      // Open chest if all hearts collected
      if (hearts.length === 0) {
        chest.open = true;
      }

      // Check for chest (get key)
      if (chest.open && Math.floor(lolo.x) === chest.x && Math.floor(lolo.y) === chest.y) {
        gate.hasKey = true;
      }

      // Check for gate (win condition)
      if (gate.hasKey && Math.floor(lolo.x) === gate.x && Math.floor(lolo.y) === gate.y) {
        alert('You Win! Reached the gate with the key!');
      }

      draw();
    };

    // Game loop for enemy timer
    const gameLoop = () => {
      updateEnemy();
      draw();
      requestAnimationFrame(gameLoop);
    };

    // Initial draw and start loop
    draw();
    gameLoop();

    // Add key listener
    window.addEventListener('keydown', handleKey);

    // Cleanup
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <h2>Enhanced StickerVerse Lolo</h2>
      <p>
        Use arrow keys to move the blue square (Lolo) half a tile at a time. Collect pink hearts for Magic Shots (Spacebar).
        Shoot the red enemy to turn it white (egg), shoot again to remove it. Get all hearts to open the yellow chest,
        then reach the green gate.
      </p>
      <canvas ref={canvasRef} width={363} height={363} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default EnhancedLoloGame;