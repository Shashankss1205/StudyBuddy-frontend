import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({ 
  currentPage, 
  totalPages, 
  setCurrentPage 
}) => {
  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="h6">
        Page {currentPage + 1} of {totalPages}
      </Typography>
      
      <Box>
        <Button
          variant="contained"
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          sx={{ mr: 1 }}
        >
          Previous Page
        </Button>
        <Button
          variant="contained"
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
        >
          Next Page
        </Button>
      </Box>
    </Box>
  );
};

export default PageNavigation; 