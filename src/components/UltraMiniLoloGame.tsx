import React, { useEffect, useRef } from 'react';

const UltraMiniLoloGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileSize = 50;
    const gridSize = 3;

    // Game state
    let lolo = { x: 0, y: 0 }; // Lolo starts at (0,0)
    let heart = { x: 2, y: 2 }; // Heart Sticker at (2,2)

    // Draw game
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#000';
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }

      // Draw Lolo (blue square)
      ctx.fillStyle = 'blue';
      ctx.fillRect(lolo.x * tileSize + 5, lolo.y * tileSize + 5, tileSize - 10, tileSize - 10);

      // Draw Heart Sticker (red circle)
      if (heart) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(heart.x * tileSize + tileSize / 2, heart.y * tileSize + tileSize / 2, tileSize / 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    // Handle movement
    const handleKey = (e: KeyboardEvent) => {
      let newX = lolo.x;
      let newY = lolo.y;
      if (e.key === 'ArrowLeft' && lolo.x > 0) newX--;
      if (e.key === 'ArrowRight' && lolo.x < gridSize - 1) newX++;
      if (e.key === 'ArrowUp' && lolo.y > 0) newY--;
      if (e.key === 'ArrowDown' && lolo.y < gridSize - 1) newY++;

      lolo.x = newX;
      lolo.y = newY;

      // Check for heart collection
      if (heart && lolo.x === heart.x && lolo.y === heart.y) {
        heart = null; // Remove heart
        alert('You Win! Collected the Heart Sticker!');
      }

      draw();
    };

    // Initial draw
    draw();

    // Add key listener
    window.addEventListener('keydown', handleKey);

    // Cleanup
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <h2>Mini StickerVerse Puzzle</h2>
      <p>Use arrow keys to move the blue square to the red circle.</p>
      <canvas ref={canvasRef} width={150} height={150} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default UltraMiniLoloGame;