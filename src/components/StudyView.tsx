import React, { RefObject, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Slider,
  Stack,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface StudyViewProps {
  currentExplanation: string;
  currentImage: string;
  currentImageUrl: string;
  zoomLevel: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  playing: boolean;
  currentTime: number;
  duration: number;
  togglePlayPause: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleSeek: (event: Event, newValue: number | number[]) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  playbackRate: number;
  handlePlaybackRateChange: (value: number) => void;
}

const formatTime = (time: number): string => {
  if (isNaN(time)) return '0:00';
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const StudyView: React.FC<StudyViewProps> = ({
  currentExplanation,
  currentImage,
  currentImageUrl,
  zoomLevel,
  audioRef,
  playing,
  currentTime,
  duration,
  togglePlayPause,
  handleTimeUpdate,
  handleLoadedMetadata,
  handleSeek,
  handleZoomIn,
  handleZoomOut,
  playbackRate,
  handlePlaybackRateChange,
}) => {
  const API_URL = 'https://studybuddy-backend-h2b4.onrender.com/'; // Add API_URL constant
  
  // Image to display (either data URL or server URL)
  // For first page, base64 data is sent directly, for other pages we need to use the URL
  const imageSource = currentImage 
    ? `data:image/jpeg;base64,${currentImage}` 
    : currentImageUrl.startsWith('http') 
      ? currentImageUrl 
      : `${API_URL}${currentImageUrl}`;

  // Log image information for debugging
  useEffect(() => {
    console.log("Image information:", {
      hasBase64Data: !!currentImage,
      imageUrl: currentImageUrl,
      fullImageUrl: imageSource
    });
  }, [currentImage, currentImageUrl, imageSource]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space key for play/pause
      if (e.code === 'Space' && !e.target.toString().includes('HTMLInputElement')) {
        e.preventDefault();
        togglePlayPause();
      }
      // Arrow keys for seeking
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const newTime = Math.min(currentTime + 5, duration);
        if (audioRef.current) {
          audioRef.current.currentTime = newTime;
        }
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const newTime = Math.max(currentTime - 5, 0);
        if (audioRef.current) {
          audioRef.current.currentTime = newTime;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.addEventListener('keydown', handleKeyPress);
    };
  }, [audioRef, currentTime, duration, togglePlayPause]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3 
      }}>
        {/* Left side - Image with zoom controls */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                mb: 2
              }}>
                <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 1}>
                  <ZoomOut />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1, alignSelf: 'center' }}>
                  {`${Math.round(zoomLevel * 100)}%`}
                </Typography>
                <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                  <ZoomIn />
                </IconButton>
              </Box>
              
              <Box sx={{ 
                maxHeight: '700px',
                overflow: 'auto',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}>
                {imageSource && (
                  <img 
                    src={imageSource} 
                    alt="PDF Page" 
                    style={{ 
                      maxWidth: '100%',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease-in-out',
                    }} 
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
        
        {/* Right side - Explanation and audio controls */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            {/* Audio Player */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={togglePlayPause}
                      color="primary"
                    >
                      {playing ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    
                    <Box sx={{ width: '100%', ml: 2 }}>
                      <Slider
                        value={currentTime}
                        max={duration || 100}
                        onChange={(e, val) => handleSeek(e as Event, val)}
                        aria-label="Audio progress"
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">
                          {formatTime(currentTime)}
                        </Typography>
                        <Typography variant="caption">
                          {formatTime(duration)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Speed:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={playbackRate}
                        onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                      >
                        <MenuItem value={0.5}>0.5x</MenuItem>
                        <MenuItem value={0.75}>0.75x</MenuItem>
                        <MenuItem value={1}>1x</MenuItem>
                        <MenuItem value={1.25}>1.25x</MenuItem>
                        <MenuItem value={1.5}>1.5x</MenuItem>
                        <MenuItem value={2}>2x</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            {/* Audio element (hidden) */}
            <audio 
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={(e) => console.error("Audio error:", e)}
              style={{ display: 'none' }}
            />
            
            {/* Explanation Text */}
            <Typography variant="h6" gutterBottom>
              Explanation
            </Typography>
            <Box sx={{ 
              maxHeight: '500px',
              overflow: 'auto',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1
            }}>
              <ReactMarkdown>{currentExplanation}</ReactMarkdown>
            </Box>

            {/* Keyboard shortcuts help */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Keyboard shortcuts: Space (play/pause), ← (rewind 5s), → (forward 5s)
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default StudyView; 