import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  QuizOutlined,
  QuestionAnswer,
  DownloadForOffline,
} from '@mui/icons-material';

interface ActionButtonsProps {
  toggleChatDialog: () => void;
  toggleQuizDialog: () => void;
  pdfName: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  toggleChatDialog,
  toggleQuizDialog,
  pdfName
}) => {
  // Handle download materials
  const handleDownload = () => {
    // Open the download endpoint in a new tab
    window.open(`http://localhost:5000/download-materials/${pdfName}`, '_blank');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
      <ButtonGroup variant="contained">
        <Button 
          startIcon={<QuestionAnswer />}
          onClick={toggleChatDialog}
        >
          Ask Questions
        </Button>
        <Button 
          startIcon={<QuizOutlined />}
          onClick={toggleQuizDialog}
        >
          Generate Quiz
        </Button>
        <Button 
          startIcon={<DownloadForOffline />}
          onClick={handleDownload}
        >
          Download Materials
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default ActionButtons; 