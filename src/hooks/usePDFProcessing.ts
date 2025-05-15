import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { PageResult, ApiResponse } from '../types';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'detailed';

export const usePDFProcessing = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PageResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [existingPDFs, setExistingPDFs] = useState<{name: string, total_pages: number, date_processed: string, original_filename: string}[]>([]);
  const [showPDFDialog, setShowPDFDialog] = useState<boolean>(true);
  const [loadingExistingPDFs, setLoadingExistingPDFs] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('intermediate');

  // Reference to the current audio file being played
  const prevPdfRef = useRef<string>('');

  useEffect(() => {
    // Fetch existing PDFs on component mount
    console.log("Initializing app - fetching existing PDFs");
    
    // Immediately fetch PDFs
    fetchExistingPDFs();
    
    // Try again after a second in case of timing issues
    const timer = setTimeout(() => {
      console.log("Retrying PDF fetch after delay");
      fetchExistingPDFs();
    }, 1000);
    
    // Debug: Check if we have valid PDFs after a delay
    const debugTimer = setTimeout(() => {
      console.log("Current existing PDFs state:", existingPDFs);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(debugTimer);
    };
  }, []);

  const fetchExistingPDFs = async () => {
    try {
      setLoadingExistingPDFs(true);
      console.log("Fetching existing PDFs from the server...");
      
      const response = await axios.get('http://localhost:5000/existing-pdfs');
      const pdfs = response.data.pdfs || [];
      
      console.log(`Found ${pdfs.length} existing PDFs:`, pdfs);
      setExistingPDFs(pdfs);
      setLoadingExistingPDFs(false);
    } catch (error) {
      console.error('Error fetching existing PDFs:', error);
      setLoadingExistingPDFs(false);
    }
  };

  const checkExistingPDF = async (fileName: string): Promise<{exists: boolean, versions?: string[], base_name?: string}> => {
    try {
      // Use the new endpoint that checks by filename
      const response = await axios.get(`http://localhost:5000/check-pdf-by-filename/${encodeURIComponent(fileName)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking existing PDF:', error);
      return { exists: false };
    }
  };

  const handleUseExistingPDF = async (pdfNameToLoad: string) => {
    try {
      setLoading(true);
      setShowPDFDialog(false);
      
      console.log(`Loading existing PDF: ${pdfNameToLoad}`);
      const response = await axios.get<ApiResponse>(`http://localhost:5000/use-existing/${pdfNameToLoad}`);
      
      // Process the response
      const { total_pages, pages, pdf_name } = response.data;
      
      console.log(`Received PDF data: ${pages.length} pages, pdf_name: ${pdf_name}`);
      console.log(`Sample image data for page 1: ${pages[0]?.image?.substr(0, 100)}...`);
      
      setTotalPages(total_pages);
      setPdfName(pdf_name);
      
      const processedPages: PageResult[] = pages.map(page => ({
        page_number: page.page_number,
        image: page.image, // Use the image directly as it's already base64 encoded
        explanation: page.explanation,
        audio: page.audio,
        audio_url: page.audio_url,
        image_url: page.image_url
      }));
      
      console.log(`Processed ${processedPages.length} pages`);
      setResults(processedPages);
      setCurrentPage(0); // Start at first page (index 0)
      setProcessingComplete(true); // Make sure we mark processing as complete
      setLoading(false);
    } catch (error) {
      console.error('Error using existing PDF:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      // Reset all states when a new file is selected
      setResults([]);
      setCurrentPage(0);
      setTotalPages(0);
      setProgress(0);
      setProcessingComplete(false);
      setError(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, selectedDifficulty?: DifficultyLevel) => {
    if (!event.target.files?.length) return;
    
    const file = event.target.files[0];
    setUploadedFileName(file.name);
    
    // Update difficulty level if provided
    if (selectedDifficulty) {
      setDifficultyLevel(selectedDifficulty);
    }
    
    // Check if PDF already exists
    const existingPdfCheck = await checkExistingPDF(file.name);
    if (existingPdfCheck.exists && existingPdfCheck.versions && existingPdfCheck.versions.length > 0) {
      // Set the base name and versions for use in the dialog
      setPdfName(existingPdfCheck.base_name || '');
      setExistingVersions(existingPdfCheck.versions);
      setSelectedVersion(existingPdfCheck.versions[0]); // Select the first version by default
      setConfirmDialogOpen(true);
      return;
    }
    
    processPDF(file);
  };

  const processPDF = async (fileOrName: File | string, diffLevel?: DifficultyLevel) => {
    setShowPDFDialog(false);
    setLoading(true);
    setCurrentPage(0);
    setResults([]);
    setProcessingComplete(false);
    setProgress(0);

    const currentDifficulty = diffLevel || difficultyLevel;
    
    console.log(`Processing PDF with difficulty level: ${currentDifficulty}`);

    const formData = new FormData();
    
    if (fileOrName instanceof File) {
      // When passing a File object
      formData.append('file', fileOrName);
      console.log(`Processing PDF: ${fileOrName.name}`);
    } else {
      // When passing a string (pdf name)
      formData.append('pdf_name', fileOrName);
      console.log(`Processing existing PDF: ${fileOrName}`);
    }
    
    // Add difficulty level to the request
    formData.append('difficulty_level', currentDifficulty);

    try {
      console.log("Uploading PDF to server...");
      const response = await axios.post('http://localhost:5000/process-pdf', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded / (progressEvent.total || 1)) * 100);
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
        // Use text format instead of stream for proper handling
        responseType: 'text',
      });

      if (response.data) {
        console.log("PDF uploaded successfully, processing stream...");
        
        // Process the streaming text response
        let receivedPages: PageResult[] = [];
        let totalPagesCount = 0;
        let currentPdfName = '';
        let firstPageReceived = false;
        
        // Split the response text by newlines and process each line as a separate JSON event
        const lines = response.data.split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          try {
            console.log("Processing line:", line);
            const event = JSON.parse(line);

            if (event.type === 'info') {
              totalPagesCount = event.total_pages;
              currentPdfName = event.pdf_name;
              setPdfName(currentPdfName);
              setTotalPages(totalPagesCount);
              console.log(`Processing PDF with ${totalPagesCount} pages, name: ${currentPdfName}`);
              
              // Initialize an empty array with the correct length to avoid issues with sparse arrays
              receivedPages = Array(totalPagesCount).fill(null);
            } else if (event.type === 'page') {
              const { page_data } = event;
              console.log(`Received page ${page_data.page_number} data`);
              
              const processedPage: PageResult = {
                page_number: page_data.page_number,
                image: `data:image/jpeg;base64,${page_data.image}`,
                explanation: page_data.explanation,
                audio: page_data.audio,
                audio_url: page_data.audio_url,
                image_url: page_data.image_url,
              };

              // Add the new page to our array (adjusting for 0-based index)
              const pageIndex = page_data.page_number - 1;
              receivedPages[pageIndex] = processedPage;
              
              // Count valid pages
              const validPagesCount = receivedPages.filter(Boolean).length;
              setProgress(validPagesCount);
              
              // Create a new array with only the valid pages to ensure React re-renders
              const validPages = receivedPages.filter(Boolean);
              
              // Update results with the new array
              setResults(validPages);
              
              // For the first page, immediately set it as current and remove loading state
              if (!firstPageReceived && page_data.page_number === 1) {
                console.log("First page received, displaying immediately");
                setCurrentPage(0);
                firstPageReceived = true;
                setLoading(false);
                
                // Notify that the first page is ready with audio
                const firstPageReadyEvent = new CustomEvent('firstPageReady', {
                  detail: { 
                    audioData: processedPage.audio,
                    audioUrl: processedPage.audio_url
                  }
                });
                window.dispatchEvent(firstPageReadyEvent);
              } else {
                // For subsequent pages, notify when they're ready
                console.log(`Page ${page_data.page_number} ready with audio`);
                const pageReadyEvent = new CustomEvent('pageReady', {
                  detail: { 
                    audioData: processedPage.audio,
                    audioUrl: processedPage.audio_url,
                    pageNumber: page_data.page_number,
                    pageIndex: pageIndex
                  }
                });
                window.dispatchEvent(pageReadyEvent);
              }
            } else if (event.type === 'complete') {
              console.log('Processing complete:', event.message);
              
              // Final update of pages
              const finalValidPages = receivedPages.filter(Boolean);
              setResults(finalValidPages);
              setProcessingComplete(true);
              setLoading(false);
              
              // Clear file state
              setFile(null);
              
              // Refresh the list of existing PDFs
              fetchExistingPDFs();
            } else if (event.type === 'error') {
              console.error('Error processing PDF:', event.error);
              setLoading(false);
              setError(event.error);
            }
          } catch (err) {
            console.error('Error parsing streamed response:', err, 'Line:', line);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setLoading(false);
      setError('Error uploading PDF. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setProgress(0);
    setProcessingComplete(false);
    
    // Reset results
    setResults([]);
    
    try {
      // Process the PDF directly with the file and difficulty level
      await processPDF(file, difficultyLevel);
      
      // File state will be cleared by processPDF after successful processing
      
    } catch (error) {
      console.error('Error uploading file:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to upload file');
      } else {
        setError('Failed to upload file');
      }
      setLoading(false);
      setProcessingComplete(false);
    }
  };

  const handleConfirmUseExisting = () => {
    // Use the selected existing PDF version
    if (selectedVersion) {
      handleUseExistingPDF(selectedVersion);
    } else {
      // Fallback to base name if no version is selected
      handleUseExistingPDF(pdfName);
    }
    setConfirmDialogOpen(false);
  };

  const handleConfirmCreateNew = () => {
    // Process as new PDF (will create with a different name)
    if (uploadedFileName) {
      const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        processPDF(fileInput.files[0], difficultyLevel);
      }
    }
    setConfirmDialogOpen(false);
  };

  const handleBackToUpload = () => {
    // Reset all states
    setShowPDFDialog(true);
    setResults([]);
    setCurrentPage(0);
    setTotalPages(0);
    setPdfName('');
    setProgress(0);
  };

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
    selectedVersion,
    difficultyLevel,
    setFile,
    setCurrentPage,
    setPdfName,
    setSelectedVersion,
    setDifficultyLevel,
    setConfirmDialogOpen,
    fetchExistingPDFs,
    handleUseExistingPDF,
    handleFileChange,
    handleFileUpload,
    handleUpload,
    handleConfirmUseExisting,
    handleConfirmCreateNew,
    handleBackToUpload,
  };
}; 