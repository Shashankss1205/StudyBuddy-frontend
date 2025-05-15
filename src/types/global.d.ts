import { PageResult, ExistingPDF } from '../types';

// Override the usePDFProcessing hook result
declare module './hooks/usePDFProcessing' {
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
    handleBackToUpload?: () => void;
  }

  export function usePDFProcessing(): PDFProcessingResult;
} 