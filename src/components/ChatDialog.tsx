import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { ChatMessage } from '../types';

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  handleSendQuestion: (question: string) => Promise<void>;
  inputValue: string;
  setInputValue: (value: string) => void;
  pdfName: string;
}

// Add this function to clean up responses with "Think and Response" prefix
const cleanResponse = (text: string): string => {
  // Remove "Think and Response." prefix if present
  return text.replace(/^Think and Response\.\s*/i, '').trim();
};

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onClose,
  messages,
  loading,
  error,
  handleSendQuestion,
  inputValue,
  setInputValue,
  pdfName
}) => {
  const [localChatInput, setLocalChatInput] = useState(inputValue);

  // Sync local state with parent state when inputValue changes
  React.useEffect(() => {
    setLocalChatInput(inputValue);
  }, [inputValue]);

  // Handle sending a message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!localChatInput.trim() || loading) return;
    
    // Update parent state
    setInputValue(localChatInput);
    await handleSendQuestion(localChatInput);
    setLocalChatInput('');
  };

  // Process messages to clean up responses
  const processedMessages = messages.map(msg => {
    if (msg.role === 'assistant' || msg.sender === 'ai') {
      return {
        ...msg,
        content: cleanResponse(msg.content)
      };
    }
    return msg;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="chat-dialog-title"
    >
      <DialogTitle id="chat-dialog-title">
        Ask Questions About {pdfName}
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Messages area */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          mb: 2, 
          p: 1, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2
        }}>
          {processedMessages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: (msg.sender === 'user' || msg.role === 'user') ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  bgcolor: (msg.sender === 'user' || msg.role === 'user') ? 'primary.light' : 'background.default',
                  color: (msg.sender === 'user' || msg.role === 'user') ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1">
                  {msg.content}
                </Typography>
              </Paper>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          ))}
          
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="textSecondary">
                Ask a question about the PDF content.
              </Typography>
            </Box>
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}
        </Box>
        
        {/* Input area */}
        <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your question..."
            value={localChatInput}
            onChange={(e) => setLocalChatInput(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    color="primary" 
                    onClick={() => handleSend()}
                    disabled={!localChatInput.trim() || loading}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatDialog; 