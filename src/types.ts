export interface PageResult {
  page_number: number;
  image: string;
  explanation: string;
  audio: string;
  audio_url: string;
  image_url: string;
}

export interface ProcessResponse {
  success: boolean;
  results: PageResult[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sender?: 'user' | 'ai';
  timestamp?: number;
}

export interface ApiResponse {
  total_pages: number;
  pdf_name: string;
  pages: PageResult[];
}

export interface ExistingPDF {
  name: string;
  total_pages: number;
  date_processed: string;
  original_filename: string;
}

export interface User {
  user_id: number;
  username: string;
  session_token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  username: string;
  password: string;
} 