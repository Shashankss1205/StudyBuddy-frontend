import { useState, useCallback } from 'react';
import axios from 'axios';
import { QuizQuestion } from '../types';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://studybuddy-backend-h2b4.onrender.com/';

interface UseQuizResult {
  showQuizDialog: boolean;
  quizQuestions: QuizQuestion[];
  loadingQuiz: boolean;
  quizError: string | null;
  toggleQuizDialog: () => void;
  generateQuiz: (pdfName: string) => Promise<void>;
  // Backward compatibility
  quizOpen?: boolean;
  selectedAnswers?: Record<number, string>;
  quizSubmitted?: boolean;
  quizScore?: number | null;
  setQuizOpen?: (open: boolean) => void;
  handleSelectAnswer?: (questionIndex: number, answer: string) => void;
  handleSubmitQuiz?: () => void;
  handleRestartQuiz?: () => void;
}

export const useQuiz = (): UseQuizResult => {
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Toggle quiz dialog
  const toggleQuizDialog = useCallback(() => {
    setShowQuizDialog(prev => !prev);
  }, []);

  // Generate quiz questions
  const generateQuiz = useCallback(async (pdfName: string) => {
    setLoadingQuiz(true);
    setQuizError(null);
    setQuizQuestions([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    
    try {
      const response = await axios.post(`${API_URL}/generate-quiz/${pdfName}`);
      setQuizQuestions(response.data || []);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setQuizError('Failed to generate quiz. Please try again.');
    } finally {
      setLoadingQuiz(false);
    }
  }, []);

  // Handle selecting an answer
  const handleSelectAnswer = useCallback((questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  }, []);

  // Submit quiz for scoring
  const handleSubmitQuiz = useCallback(() => {
    // Simple scoring algorithm
    let score = 0;
    quizQuestions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      if (userAnswer === question.correctAnswer) {
        score++;
      }
    });
    
    const percentage = Math.round((score / quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);
  }, [quizQuestions, selectedAnswers]);

  // Restart quiz
  const handleRestartQuiz = useCallback(() => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  }, []);

  return {
    showQuizDialog,
    quizQuestions,
    loadingQuiz,
    quizError,
    toggleQuizDialog,
    generateQuiz,
    // Backward compatibility
    quizOpen: showQuizDialog,
    selectedAnswers,
    quizSubmitted,
    quizScore,
    setQuizOpen: setShowQuizDialog,
    handleSelectAnswer,
    handleSubmitQuiz,
    handleRestartQuiz
  };
}; 