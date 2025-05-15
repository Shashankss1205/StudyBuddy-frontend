import { useState } from 'react';

interface UseZoomResult {
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export const useZoom = (): UseZoomResult => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel(prevZoom => Math.min(3, prevZoom + 0.2));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prevZoom => Math.max(1, prevZoom - 0.2));
    }
  };

  return {
    zoomLevel,
    handleZoomIn,
    handleZoomOut
  };
}; 