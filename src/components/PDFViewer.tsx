import React from 'react';
import { Box, CardMedia, IconButton, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { PageResult } from '../types';

interface PDFViewerProps {
  currentPage: number;
  results: PageResult[];
  zoomLevel: number;
  handleZoom: (direction: 'in' | 'out') => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  currentPage,
  results,
  zoomLevel,
  handleZoom
}) => {
  if (!results[currentPage]) return null;
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        className="pdf-scroll-container"
        sx={{
          width: '100%',
          maxHeight: '70vh',
          overflow: 'auto',
          position: 'relative',
          // Add CSS to improve scrolling behavior
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
        }}
      >
        <Box
          sx={{
            // Use padding instead of minWidth/minHeight for better scrolling experience
            padding: `${(zoomLevel - 1) * 50}%`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <CardMedia
            component="img"
            image={results[currentPage]?.image.startsWith('data:') 
              ? results[currentPage].image 
              : `data:image/jpeg;base64,${results[currentPage].image}`}
            alt={`Page ${results[currentPage]?.page_number}`}
            sx={{ 
              maxWidth: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center top', 
              transition: 'transform 0.2s',
            }}
          />
        </Box>
      </Box>
      <Box sx={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10,
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 1,
        padding: 0.5,
        zIndex: 10
      }}>
        <Tooltip title="Zoom In">
          <IconButton onClick={() => handleZoom('in')} disabled={zoomLevel >= 3}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={() => handleZoom('out')} disabled={zoomLevel <= 0.5}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default PDFViewer; 