import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
} from '@mui/material';
import { 
  CloudUpload, 
  DarkMode,
  LightMode,
  AccountCircle,
  Logout,
  Chat as ChatIcon,
} from '@mui/icons-material';
import axios from 'axios';
// Custom components
import PDFUploadDialog from './components/PDFUploadDialog';
import QuizDialog from './components/QuizDialog';
import ChatDialog from './components/ChatDialog';
import ConfirmDialog from './components/ConfirmDialog';
import PageNavigation from './components/PageNavigation';
import ActionButtons from './components/ActionButtons';
import StudyView from './components/StudyView';
import { AuthForms } from './components/AuthForms';

// Custom hooks
import { ExistingPDF } from './types';
import { usePDFProcessing } from './hooks/usePDFProcessing';
import { useAudio } from './hooks/useAudio';
import { useQuiz } from './hooks/useQuiz';
import { useChat } from './hooks/useChat';
import { useZoom } from './hooks/useZoom';
import { useTheme } from './theme/ThemeProvider';
import { useAuth } from './hooks/useAuth';

// Add API_URL constant
const API_URL = 'https://studybuddy-backend-h2b4.onrender.com/';


// Wrapper for audio component to handle type issues
const AudioPlayer: React.FC<{
  audioRef: React.RefObject<HTMLAudioElement | null>;
  src: string;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
}> = ({ audioRef, src, onTimeUpdate, onLoadedMetadata }) => {
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
  }, [audioRef, src]);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={onTimeUpdate}
      onLoadedMetadata={onLoadedMetadata}
      style={{ display: 'none' }}
    />
  );
};

function App() {
  // Get the theme toggle function
  const { mode, toggleThemeMode } = useTheme();

  // Get authentication state
  const { user, isAuthenticated, logout } = useAuth();

  // User menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  // Local state management instead of using the hook
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({ pages: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfName, setPDFName] = useState('');
  const [existingPDFs, setExistingPDFs] = useState<ExistingPDF[]>([]);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [loadingExistingPDFs, setLoadingExistingPDFs] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);

  // Audio states and hooks
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');
  const {
    playing,
    currentTime,
    duration,
    audioRef,
    togglePlayPause,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,
    playbackRate,
    handlePlaybackRateChange,
  } = useAudio(currentAudioUrl);

  // File change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      // Check if PDF exists on server
      checkIfPDFExists(selectedFile.name);
    }
  };

  // Check if PDF exists
  const checkIfPDFExists = async (filename: string) => {
    try {
      const response = await axios.get(`${API_URL}/check-pdf-by-filename/${encodeURIComponent(filename)}`);
      
      if (response.data.exists) {
        // PDF exists, show confirm dialog
        setExistingVersions(response.data.versions || []);
        setConfirmDialogOpen(true);
      }
    } catch (error) {
      console.error('Error checking if PDF exists:', error);
    }
  };

  // Toggle PDF dialog
  const togglePDFDialog = () => {
    setShowPDFDialog(prev => !prev);
  };

  // Process PDF function
  const handleProcessPDF = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults({ pages: [] });
    setProgress(0);
    setProcessingComplete(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty_level', 'detailed'); // Default difficulty

    try {
      // Use fetch for easier handling of streaming responses
      const response = await fetch(`${API_URL}/process-pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studybuddy_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      // Create a reader to process the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response has no readable body');
      }

      // Set pdfName variable to store the PDF name when we receive it
      let pdf_name_from_response = '';
      
      // Process chunks as they arrive
      const processChunks = async () => {
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Handle any remaining data in buffer
            if (buffer.trim()) {
              try {
                const data = JSON.parse(buffer.trim());
                handleResponseData(data);
              } catch (e) {
                console.error('Error parsing final buffer:', e);
              }
            }
            break;
          }

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process each line
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line.trim());
                handleResponseData(data);
              } catch (e) {
                console.error('Error parsing line:', line, e);
              }
            }
          }
        }

        // Processing is complete
        setProcessingComplete(true);
        setProgress(100);
        
        // Refresh the PDFs list and load the processed PDF
        await refreshExistingPDFs();
        
        // If we got a PDF name from the response, load it
        if (pdf_name_from_response) {
          await loadExistingPDF(pdf_name_from_response);
          // Close the upload dialog after loading
          setShowPDFDialog(false);
        }
      };

      // Handler for each data chunk
      const handleResponseData = (data: any) => {
        console.log('Received data:', data);
        
        switch (data.type) {
          case 'info':
            setTotalPages(data.total_pages);
            pdf_name_from_response = data.pdf_name;
            setPDFName(data.pdf_name);
            break;
            
          case 'progress':
            setProgress(data.progress);
            break;
            
          case 'page':
            // Add this page to results
            setResults(prev => {
              const pages = [...prev.pages];
              pages[data.page_data.page_number - 1] = data.page_data;
              return { ...prev, pages };
            });
            break;
            
          case 'complete':
            setProcessingComplete(true);
            setProgress(100);
            pdf_name_from_response = data.pdf_name;
            setPDFName(data.pdf_name);
            break;
            
          case 'error':
            setError(data.error);
            break;
            
          default:
            console.log('Unknown data type:', data);
        }
      };

      // Start processing the chunks
      await processChunks();
      
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setError(error.message || 'Error processing PDF');
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm use existing
  const handleConfirmUseExisting = () => {
    setConfirmDialogOpen(false);
    
    // Load the first version of the existing PDF
    if (existingVersions.length > 0) {
      loadExistingPDF(existingVersions[0]);
    }
    
    // Close the upload dialog
    setShowPDFDialog(false);
  };

  // Handle cancel use existing
  const handleCancelUseExisting = () => {
    setConfirmDialogOpen(false);
  };

  // Load an existing PDF
  const loadExistingPDF = async (pdfName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/use-existing/${pdfName}`);
      
      setResults({
        pages: response.data.pages,
        total_pages: response.data.total_pages,
        pdf_name: response.data.pdf_name
      });
      setTotalPages(response.data.total_pages);
      setPDFName(response.data.pdf_name);
      setCurrentPage(1);
      setProcessingComplete(true);
      setProgress(100);
    } catch (error: any) {
      console.error('Error loading existing PDF:', error);
      setError(error.response?.data?.error || 'Error loading existing PDF');
    } finally {
      setLoading(false);
    }
  };

  // Refresh existing PDFs
  const refreshExistingPDFs = async () => {
    setLoadingExistingPDFs(true);
    
    try {
      // Get token directly from localStorage for this request
      const token = localStorage.getItem('studybuddy_token');
      
      // Debug headers
      console.log("Auth header before request:", axios.defaults.headers.common['Authorization']);
      
      // Make API call with explicit headers if needed
      const response = await axios.get(`${API_URL}/existing-pdfs`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      
      console.log("Existing PDFs response:", response.data);
      setExistingPDFs(response.data.pdfs || []);
    } catch (error: any) {
      console.error('Error fetching existing PDFs:', error);
      
      // Handle 401 Unauthorized errors (expired token)
      if (error.response && error.response.status === 401) {
        console.log("Session expired, logging out...");
        // Clear localStorage
        localStorage.removeItem('studybuddy_token');
        localStorage.removeItem('studybuddy_user');
        // Clear authorization header
        delete axios.defaults.headers.common['Authorization'];
        // Force reload to show login screen
        window.location.reload();
      }
    } finally {
      setLoadingExistingPDFs(false);
    }
  };

  // Add debugging useEffect for authentication
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('studybuddy_token');
    console.log("Token in localStorage:", token ? "exists" : "missing");
    
    // Check if axios headers are set correctly
    console.log("Axios auth header:", axios.defaults.headers.common['Authorization']);
    
    // Set auth header if token exists but header doesn't
    if (token && !axios.defaults.headers.common['Authorization']) {
      console.log("Setting missing auth header");
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Get the correct explanations and images for the current page
  // @ts-ignore - Ignore type issues with results structure
  const currentExplanation = results?.pages?.[currentPage - 1]?.explanation || '';
  // @ts-ignore - Ignore type issues with results structure
  const currentImage = results?.pages?.[currentPage - 1]?.image || '';
  // @ts-ignore - Ignore type issues with results structure
  const currentImageUrl = results?.pages?.[currentPage - 1]?.image_url || '';

  // Store current explanation in localStorage for chat feature
  useEffect(() => {
    if (currentExplanation) {
      localStorage.setItem('studybuddy_current_explanation', currentExplanation);
    }
  }, [currentExplanation]);

  // Use zoom hook
  const { zoomLevel, handleZoomIn, handleZoomOut } = useZoom();

  // Use quiz hook
  const {
    showQuizDialog,
    quizQuestions,
    loadingQuiz,
    quizError,
    toggleQuizDialog,
    generateQuiz
  } = useQuiz();

  // Use chat hook
  const {
    showChatDialog,
    chatMessages,
    loadingAnswer,
    chatError,
    toggleChatDialog,
    handleSendQuestion,
    chatInputValue,
    setChatInputValue
  } = useChat(pdfName);

  // Load existing PDFs on component mount if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, refreshing PDFs");
      
      // Ensure authentication header is set
      const token = localStorage.getItem('studybuddy_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Small delay to ensure auth headers are applied
      setTimeout(() => {
        refreshExistingPDFs();
      }, 500);
    }
  }, [isAuthenticated]);

  // Set the current audio URL when the current page changes
  useEffect(() => {
    if (results?.pages && results.pages.length > 0 && currentPage > 0) {
      // Access the audio_url for the current page
      const pageData = results.pages[currentPage - 1];
      if (pageData && pageData.audio_url) {
        setCurrentAudioUrl(pageData.audio_url);
        console.log(`Setting audio URL for page ${currentPage} to:`, pageData.audio_url);
      }
    }
  }, [currentPage, results?.pages]);

  // Add debugging for audio URL
  useEffect(() => {
    if (results?.pages && results.pages.length > 0 && currentPage > 0 && currentPage <= results.pages.length) {
      console.log("Current audio URL:", currentAudioUrl);
      
      // Check if we need to prepend the API URL
      const fullAudioUrl = currentAudioUrl.startsWith('http') 
        ? currentAudioUrl 
        : `${API_URL}${currentAudioUrl}`;
      
      console.log("Full audio URL:", fullAudioUrl);
      
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.src = fullAudioUrl;
        audioElement.load();
        
        // Add event listeners for debugging
        audioElement.onerror = (e) => {
          console.error("Audio loading error:", e);
        };
        
        audioElement.onloadeddata = () => {
          console.log("Audio loaded successfully, duration:", audioElement.duration);
        };
      }
    }
  }, [currentPage, results, audioRef, currentAudioUrl]);

  // Add more detailed debugging
  useEffect(() => {
    console.log("Current results structure:", results);
    
    if (results?.pages && currentPage > 0) {
      const currentPageData = results.pages[currentPage - 1];
      console.log(`Data for page ${currentPage}:`, currentPageData);
      
      if (currentPageData) {
        console.log("Audio URL:", currentPageData.audio_url);
        console.log("Image URL:", currentPageData.image_url);
        console.log("Has audio data:", !!currentPageData.audio);
        console.log("Has image data:", !!currentPageData.image);
      }
    }
  }, [currentPage, results]);

  // Add effect to add authorization header to axios on component mount
  useEffect(() => {
    // Add authorization header to all axios requests
    const token = localStorage.getItem('studybuddy_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Create axios response interceptor for handling errors
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          console.log("Received 401 from server - clearing auth state");
          // Clear localStorage
          localStorage.removeItem('studybuddy_token');
          localStorage.removeItem('studybuddy_user');
          // Clear authorization header
          delete axios.defaults.headers.common['Authorization'];
          // Force reload to show login screen
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );

    // Return cleanup function
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Study Buddy - PDF to Audio
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4 }}>
            Sign in to access your PDFs and study materials
          </Typography>
          <AuthForms />
        </Box>
      </Container>
    );
  }

  // Main app content for authenticated users
  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Study Buddy - PDF to Audio
          </Typography>
          
          {/* Theme toggle */}
          <IconButton color="inherit" onClick={toggleThemeMode} sx={{ mr: 2 }}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          
          {/* User profile section */}
          {isAuthenticated && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                <Typography sx={{ px: 2, py: 1 }}>
                  Hello, {user?.username}
                </Typography>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Logout sx={{ mr: 1 }} fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Initial state - show upload button and existing PDFs */}
        {!loading && (!results?.pages || results.pages.length === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upload a PDF
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={togglePDFDialog}
                fullWidth
                sx={{ mt: 2 }}
              >
                Choose PDF File
              </Button>
              
              {/* Existing PDFs section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Your PDFs
                </Typography>
                {loadingExistingPDFs ? (
                  <CircularProgress size={24} sx={{ mt: 2 }} />
                ) : existingPDFs.length > 0 ? (
                  <Box>
                    {existingPDFs.map((pdf: ExistingPDF) => (
                      <Paper 
                        key={pdf.name} 
                        sx={{ 
                          p: 2, 
                          mt: 2, 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                        onClick={() => loadExistingPDF(pdf.name)}
                      >
                        <Typography variant="subtitle1">{pdf.original_filename}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pages: {pdf.total_pages} • Processed: {pdf.date_processed}
                        </Typography>
                      </Paper>
                    ))}
                </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No PDFs found. Upload a PDF to get started.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Processing PDF...
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {progress}% complete
              </Typography>
            </Box>
            {processingComplete && (
              <Alert severity="success" sx={{ mt: 2 }}>
                PDF processed successfully! Loading content...
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {error}
              </Alert>
            )}
          </Box>
        )}
        
        {/* Study view when PDF is loaded */}
        {!loading && results?.pages && results.pages.length > 0 && (
          <StudyView 
            currentExplanation={currentExplanation}
            currentImage={currentImage}
            currentImageUrl={currentImageUrl}
            zoomLevel={zoomLevel}
            audioRef={audioRef}
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            togglePlayPause={togglePlayPause}
            handleTimeUpdate={handleTimeUpdate}
            handleLoadedMetadata={handleLoadedMetadata}
            handleSeek={handleSeek}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            playbackRate={playbackRate}
            handlePlaybackRateChange={handlePlaybackRateChange}
          />
        )}
        
        {/* Page navigation */}
        {!loading && results?.pages && results.pages.length > 0 && (
                <PageNavigation
                  currentPage={currentPage}
            totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
        )}
        
        {/* Action buttons */}
        {!loading && results?.pages && results.pages.length > 0 && (
          <ActionButtons 
            toggleChatDialog={toggleChatDialog}
            toggleQuizDialog={toggleQuizDialog}
            pdfName={pdfName}
          />
        )}
      </Container>
      
      {/* Upload Dialog */}
      <PDFUploadDialog 
        open={showPDFDialog}
        onClose={togglePDFDialog}
        handleFileChange={handleFileChange}
        handleProcessPDF={handleProcessPDF}
        file={file}
        loading={loading}
        progress={progress}
        totalPages={totalPages}
        processingComplete={processingComplete}
      />
      
      {/* Confirm Dialog */}
      <ConfirmDialog 
        open={confirmDialogOpen}
        onConfirm={handleConfirmUseExisting}
        onCancel={handleCancelUseExisting}
        title="PDF Already Exists"
        message={`A PDF with this name already exists. Would you like to use the existing version(s)? ${existingVersions.join(', ')}`}
      />
      
      {/* Quiz Dialog */}
                <QuizDialog
        open={showQuizDialog}
        onClose={toggleQuizDialog}
        loading={loadingQuiz}
        questions={quizQuestions}
        error={quizError}
        generateQuiz={() => generateQuiz(pdfName)}
      />
      
      {/* Chat Dialog */}
      <ChatDialog 
        open={showChatDialog}
        onClose={toggleChatDialog}
        messages={chatMessages}
        loading={loadingAnswer}
        error={chatError}
        handleSendQuestion={handleSendQuestion}
        inputValue={chatInputValue}
        setInputValue={setChatInputValue}
        pdfName={pdfName}
      />
      
      {/* Fixed position buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={toggleChatDialog}
          sx={{ mr: 1 }}
        >
          <ChatIcon />
        </Fab>
      </Box>
    </Box>
  );
}

export default App;