import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  SelectChangeEvent,
  LinearProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface PDFUploadDialogProps {
  open: boolean;
  onClose: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleProcessPDF: () => void;
  file: File | null;
  loading?: boolean;
  progress?: number;
  totalPages?: number;
  processingComplete?: boolean;
}

const PDFUploadDialog: React.FC<PDFUploadDialogProps> = ({
  open,
  onClose,
  handleFileChange,
  handleProcessPDF,
  file,
  loading = false,
  progress = 0,
  totalPages = 0,
  processingComplete = false,
}) => {
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'detailed'>('detailed');
  const [processing, setProcessing] = useState(false);

  // Handle difficulty level change
  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficultyLevel(event.target.value as 'beginner' | 'intermediate' | 'detailed');
  };

  // Handle file upload and processing
  const handleUpload = async () => {
    if (!file) return;
    
    setProcessing(true);
    
    try {
      if (typeof handleProcessPDF === 'function') {
        await handleProcessPDF();
        // Dialog will be closed by the parent component after processing
      } else {
        console.error('handleProcessPDF is not a function:', handleProcessPDF);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      setProcessing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!processing && !loading ? onClose : undefined} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Upload PDF</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Select a PDF file to upload and process
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
            <input
              accept=".pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
                disabled={processing || loading}
              >
                Choose PDF File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected file: {file.name}
              </Typography>
            )}
          </Box>

          {/* Display progress information */}
          {(processing || loading) && (
            <Box sx={{ mt: 3, width: '100%' }}>
              <Typography variant="body2" gutterBottom>
                {progress < 30 ? 'Uploading PDF...' : 
                 progress < 100 ? 'Processing PDF content...' : 
                 'Finalizing...'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {progress.toFixed(0)}% complete
                </Typography>
                {totalPages > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {progress < 30 ? 'Uploading file...' : 
                     `Processing page ${Math.ceil((progress - 30) * totalPages / 70)} of ${totalPages}`}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Difficulty level selector */}
          {!processing && !loading && (
            <Box sx={{ width: '100%', mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="difficulty-select-label">Explanation Difficulty</InputLabel>
                <Select
                  labelId="difficulty-select-label"
                  id="difficulty-select"
                  value={difficultyLevel}
                  label="Explanation Difficulty"
                  onChange={handleDifficultyChange}
                >
                  <MenuItem value="beginner">Beginner (Simplified)</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="detailed">Detailed (Advanced)</MenuItem>
                </Select>
                <FormHelperText>Choose how detailed you want the explanations to be</FormHelperText>
              </FormControl>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="primary"
          disabled={processing || loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          color="primary"
          variant="contained"
          disabled={!file || processing || loading}
        >
          {processing || loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Processing
            </Box>
          ) : (
            'Process PDF'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFUploadDialog; 