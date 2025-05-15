import { useState, useCallback } from 'react';
import axios from 'axios';
import { ChatMessage } from '../types';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://studybuddy-backend-h2b4.onrender.com/';

interface UseChatResult {
  showChatDialog: boolean;
  chatMessages: ChatMessage[];
  loadingAnswer: boolean;
  chatError: string | null;
  toggleChatDialog: () => void;
  handleSendQuestion: (question: string) => Promise<void>;
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  // Include older properties for backward compatibility
  isChatOpen?: boolean;
  setIsChatOpen?: (value: boolean) => void;
  setChatMessages?: (messages: ChatMessage[]) => void;
  getCombinedPdfContext?: () => string;
}

export const useChat = (pdfName: string): UseChatResult => {
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');

  // Toggle chat dialog
  const toggleChatDialog = useCallback(() => {
    setShowChatDialog(prev => !prev);
  }, []);

  // Get combined context from all explanations
  const getCombinedPdfContext = useCallback(() => {
    // This would typically retrieve context from PDF explanations
    // But for now, let's return a placeholder
    return `PDF: ${pdfName}`;
  }, [pdfName]);

  // Add a helper to clean responses
  const cleanResponse = (text: string): string => {
    // Remove "Think and Response." prefix if present
    return text.replace(/^Think and Response\.\s*/i, '').trim();
  };

  // Send question to the backend
  const handleSendQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;
    
    // Get currentExplanation from the App component
    const currentExplanation = localStorage.getItem('studybuddy_current_explanation') || '';

    try {
      setLoadingAnswer(true);
      setChatError(null);
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: question,
        sender: 'user',
        timestamp: Date.now()
      };
      
      setChatMessages(prevMessages => [...prevMessages, userMessage]);
      setChatInputValue('');
      
      // Send question to backend API
      const response = await axios.post(`${API_URL}/ask-question`, {
        question,
        context: currentExplanation,
        pdf_name: pdfName  // Include PDF name in request
      });
      
      // Process response to remove any "Think and Response" prefix
      const cleanedAnswer = cleanResponse(response.data.answer || '');
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: cleanedAnswer,
        sender: 'ai',
        timestamp: Date.now()
      };
      
      setChatMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending question:', error);
      setChatError('Failed to get answer. Please try again.');
    } finally {
      setLoadingAnswer(false);
    }
  }, [pdfName]);

  return {
    showChatDialog,
    chatMessages,
    loadingAnswer,
    chatError,
    toggleChatDialog,
    handleSendQuestion,
    chatInputValue,
    setChatInputValue,
    // For backward compatibility
    isChatOpen: showChatDialog,
    setIsChatOpen: setShowChatDialog,
    setChatMessages,
    getCombinedPdfContext
  };
}; 