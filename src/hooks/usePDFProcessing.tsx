import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { PageResult, ExistingPDF } from '../types';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'detailed';

// API URL from environment variable or default to localhost
const API_URL = 'http://localhost:5000';

// Define the structure expected by App.tsx
export interface PDFResults {
  pages: PageResult[];
  total_pages: number;
  pdf_name: string;
}

export interface PDFProcessingResult {
  file: File | null;
  loading: boolean;
  results: PDFResults;
  currentPage: number;
  totalPages: number;
  progress: number;
  processingComplete: boolean;
  error: string | null;
  pdfName: string;
  existingPDFs: ExistingPDF[];
  showPDFDialog: boolean;
  loadingExistingPDFs: boolean;
  confirmDialogOpen: boolean;
  existingVersions: string[];
  setPDFName: (name: string) => void;
  setCurrentPage: (page: number) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleProcessPDF: () => Promise<void>;
  togglePDFDialog: () => void;
  handleConfirmUseExisting: () => void;
  handleCancelUseExisting: () => void;
  loadExistingPDF: (pdfName: string) => void;
  refreshExistingPDFs: () => void;
  handleBackToUpload?: () => void; // Optional method
}

export function usePDFProcessing(): PDFProcessingResult {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PDFResults>({ 
    pages: [], 
    total_pages: 0, 
    pdf_name: '' 
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfName, setPDFName] = useState<string>('');
  const [existingPDFs, setExistingPDFs] = useState<ExistingPDF[]>([]);
  const [loadingExistingPDFs, setLoadingExistingPDFs] = useState<boolean>(false);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('detailed');
  const [showPDFDialog, setShowPDFDialog] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [tempFilename, setTempFilename] = useState<string>('');

  // Toggle the PDF upload dialog
  const togglePDFDialog = useCallback(() => {
    setShowPDFDialog(prev => !prev);
  }, []);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setTempFilename(selectedFile.name);

      // Check if this PDF exists already
      checkIfPDFExists(selectedFile.name);
    }
  }, []);

  // Check if PDF exists
  const checkIfPDFExists = useCallback(async (filename: string) => {
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
  }, []);

  // Handle confirm use existing
  const handleConfirmUseExisting = useCallback(() => {
    // Close the confirm dialog
    setConfirmDialogOpen(false);
    
    // Load the first version of the existing PDF
    if (existingVersions.length > 0) {
      loadExistingPDF(existingVersions[0]);
    }
    
    // Close the upload dialog if it's open
    setShowPDFDialog(false);
  }, [existingVersions]);

  // Handle cancel use existing
  const handleCancelUseExisting = useCallback(() => {
    // Close the confirm dialog only, keep the file selected
    setConfirmDialogOpen(false);
  }, []);

  // Process the PDF
  const handleProcessPDF = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults({ pages: [], total_pages: 0, pdf_name: '' });
    setProgress(0);
    setProcessingComplete(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty_level', difficultyLevel);

    try {
      const response = await axios.post(`${API_URL}/process-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadPercentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(uploadPercentage > 95 ? 95 : uploadPercentage); // Cap at 95% until processing is complete
          }
        },
      });

      // Handle case where PDF already exists
      if (response.data.type === 'existing') {
        // Load the existing PDF
        await loadExistingPDF(response.data.pdf_name);
        return;
      }

      // If processing was successful, we should use the streaming response
      // which will be handled separately via the processStreamingResponse function
      // This is a safety fallback
      setProcessingComplete(true);
      setProgress(100);
      
      // Refresh the list of existing PDFs
      refreshExistingPDFs();
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setError(error.response?.data?.error || 'Error processing PDF');
      setLoading(false);
    }
  }, [file, difficultyLevel]);

  // Process streaming response from the server (SSE)
  const processStreamingResponse = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults({ pages: [], total_pages: 0, pdf_name: '' });
    setProgress(0);
    setProcessingComplete(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty_level', difficultyLevel);

    try {
      const response = await fetch(`${API_URL}/process-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader not available');
      }

      // Create an array to hold all pages
      const allPages: PageResult[] = [];
      let pdfNameFromResponse = '';
      let totalPagesFromResponse = 0;

      // Process the stream
      const processStream = async () => {
        let chunks = '';
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            // Convert Uint8Array to string
            const chunk = new TextDecoder().decode(value);
            chunks += chunk;

            // Process each line in the chunk
            const lines = chunks.split('\n');
            
            // Process all lines except the last one (which might be incomplete)
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (line) {
                try {
                  const data = JSON.parse(line);

                  if (data.type === 'info') {
                    // Got initial info about the PDF
                    totalPagesFromResponse = data.total_pages;
                    pdfNameFromResponse = data.pdf_name;
                    setTotalPages(data.total_pages);
                    setPDFName(data.pdf_name);
                  } else if (data.type === 'page') {
                    // Got a page result
                    allPages.push(data.page_data);
                    setProgress(Math.floor((allPages.length / totalPagesFromResponse) * 100));
                  } else if (data.type === 'complete') {
                    // Processing is complete
                    setProcessingComplete(true);
                    setProgress(100);
                  } else if (data.type === 'error') {
                    // There was an error
                    setError(data.message);
                  } else if (data.type === 'existing') {
                    // PDF already exists, load it
                    await loadExistingPDF(data.pdf_name);
                    return; // Exit the loop
                  }
                } catch (parseError) {
                  console.error('Error parsing JSON:', parseError, 'Line:', line);
                }
              }
            }

            // Keep the last line for the next iteration
            chunks = lines[lines.length - 1];
          }
        }
      };

      await processStream();

      // Update the results with all pages
      setResults({
        pages: [...allPages],
        total_pages: totalPagesFromResponse,
        pdf_name: pdfNameFromResponse
      });
      setLoading(false);
      
      // Refresh the list of existing PDFs
      refreshExistingPDFs();
    } catch (error: any) {
      console.error('Error in streaming PDF processing:', error);
      setError(error.message || 'Error processing PDF');
      setLoading(false);
    }
  }, [file, difficultyLevel]);

  // Load an existing PDF
  const loadExistingPDF = useCallback(async (pdfName: string) => {
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
  }, []);

  // Get list of existing PDFs
  const refreshExistingPDFs = useCallback(async () => {
    setLoadingExistingPDFs(true);
    
    try {
      const response = await axios.get(`${API_URL}/existing-pdfs`);
      setExistingPDFs(response.data.pdfs || []);
    } catch (error) {
      console.error('Error fetching existing PDFs:', error);
    } finally {
      setLoadingExistingPDFs(false);
    }
  }, []);

  return {
    file,
    loading,
    results,
    currentPage,
    totalPages,
    progress,
    processingComplete,
    error,
    pdfName,
    existingPDFs,
    showPDFDialog,
    loadingExistingPDFs,
    confirmDialogOpen,
    existingVersions,
    setPDFName,
    setCurrentPage,
    handleFileChange,
    handleProcessPDF,
    togglePDFDialog,
    handleConfirmUseExisting,
    handleCancelUseExisting,
    loadExistingPDF,
    refreshExistingPDFs
  };
} 