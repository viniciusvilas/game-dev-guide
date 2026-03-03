// Iron Contract — Terrain Canvas (renders terrain via ImageData)

import { useRef, useEffect, memo } from 'react';
import type { TerrainMap } from '@/lib/generators/terrainGenerator';

interface TerrainCanvasProps {
  terrainMap: TerrainMap;
  nightMode?: boolean;
}

function TerrainCanvasInner({ terrainMap, nightMode = false }: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = terrainMap.width;
    canvas.height = terrainMap.height;

    const imageData = new ImageData(
      new Uint8ClampedArray(terrainMap.pixelData),
      terrainMap.width,
      terrainMap.height,
    );
    ctx.putImageData(imageData, 0, 0);

    // Night overlay
    if (nightMode) {
      ctx.fillStyle = 'rgba(0, 10, 30, 0.4)';
      ctx.fillRect(0, 0, terrainMap.width, terrainMap.height);
    }
  }, [terrainMap, nightMode]);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const TerrainCanvas = memo(TerrainCanvasInner);
export default TerrainCanvas;
