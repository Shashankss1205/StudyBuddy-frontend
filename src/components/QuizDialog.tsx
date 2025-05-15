import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { QuizQuestion } from '../types';

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  questions: QuizQuestion[];
  error: string | null;
  generateQuiz: () => void;
}

const QuizDialog: React.FC<QuizDialogProps> = ({
  open,
  onClose,
  loading,
  questions,
  error,
  generateQuiz
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert(`Please answer all questions. You have answered ${Object.keys(selectedAnswers).length} of ${questions.length} questions.`);
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    setScore(scorePercent);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(null);
  };

  const handleCloseDialog = () => {
    onClose();
    // Reset the quiz state when closing
    handleResetQuiz();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="quiz-dialog-title"
    >
      <DialogTitle id="quiz-dialog-title">Test Your Knowledge</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : questions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              No quiz available yet. Click "Generate Quiz" to create questions based on the PDF content.
            </Typography>
            <Button
              variant="contained"
              onClick={generateQuiz}
              sx={{ mt: 2 }}
            >
              Generate Quiz
            </Button>
          </Box>
        ) : (
          <Box>
            {quizSubmitted && score !== null && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  Your Score: {score}%
                </Typography>
                <Typography variant="body1">
                  You got {Math.round((score / 100) * questions.length)} out of {questions.length} questions correct.
                </Typography>
              </Paper>
            )}
            
            {questions.map((question, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Question {index + 1}: {question.question}
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={selectedAnswers[index] || ''}
                    onChange={(e) => handleSelectAnswer(index, e.target.value)}
                  >
                    {question.options.map((option, optIndex) => (
                      <FormControlLabel
                        key={optIndex}
                        value={String.fromCharCode(65 + optIndex)} // A, B, C, D
                        control={<Radio />}
                        label={
                          <Typography
                            sx={{
                              ...(quizSubmitted && 
                                String.fromCharCode(65 + optIndex) === question.correctAnswer && {
                                  color: 'success.main',
                                  fontWeight: 'bold'
                                }),
                              ...(quizSubmitted && 
                                selectedAnswers[index] === String.fromCharCode(65 + optIndex) && 
                                selectedAnswers[index] !== question.correctAnswer && {
                                  color: 'error.main'
                                })
                            }}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Typography>
                        }
                        disabled={quizSubmitted}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                
                {quizSubmitted && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Explanation:
                    </Typography>
                    <Typography variant="body2">
                      {question.explanation}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseDialog} color="primary">
          Close
        </Button>
        
        {questions.length > 0 && !quizSubmitted && (
          <Button 
            onClick={handleSubmitQuiz} 
            color="primary" 
            variant="contained"
            disabled={Object.keys(selectedAnswers).length < questions.length}
          >
            Submit Answers
          </Button>
        )}
        
        {quizSubmitted && (
          <Button 
            onClick={handleResetQuiz} 
            color="primary" 
            variant="contained"
          >
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizDialog; 