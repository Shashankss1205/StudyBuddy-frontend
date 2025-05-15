import React, { useState, useRef, useEffect } from 'react';
import { 
  IconButton, 
  CircularProgress, 
  Box, 
  Typography, 
  Slider, 
  Stack, 
  Tooltip 
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeDown, 
  ReplayOutlined 
} from '@mui/icons-material';
import SpeedIcon from '@mui/icons-material/Speed';
import { formatTime } from '../utils/formatUtils';
import { PageResult } from '../types';

interface AudioPlayerProps {
  currentPage: number;
  results: PageResult[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioPlaying: boolean;
  isPaused: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  handlePlayAudio: (audioData: string, audioUrl?: string) => void;
  handleReplay: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentPage,
  results,
  audioRef,
  audioPlaying,
  isPaused,
  volume,
  setVolume,
  playbackRate,
  setPlaybackRate,
  handlePlayAudio,
  handleReplay
}) => {
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeSliderValue, setTimeSliderValue] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const sliderRef = useRef<HTMLSpanElement>(null);
  
  // Update currentTime and slider position
  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateTime = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
      setTimeSliderValue(audioRef.current?.currentTime || 0);
    };
    
    // Set duration once loaded
    const handleLoadedMetadata = () => {
      setAudioDuration(audioRef.current?.duration || 0);
      console.log("Audio duration set:", audioRef.current?.duration);
      setIsAudioLoading(false);
    };
    
    const handleLoadStart = () => {
      setIsAudioLoading(true);
    };
    
    // Update time during playback
    audioRef.current.addEventListener('loadstart', handleLoadStart);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('timeupdate', updateTime);
    
    // Set initial duration if already available
    if (audioRef.current.duration) {
      handleLoadedMetadata();
    }
    
    return () => {
      audioRef.current?.removeEventListener('timeupdate', updateTime);
      audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current?.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioRef.current]);
  
  // Reset state when page changes
  useEffect(() => {
    setAudioDuration(0);
    setCurrentTime(0);
    setTimeSliderValue(0);
  }, [currentPage]);
  
  // Handle time slider change
  const handleTimeSliderChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setTimeSliderValue(value);
  };
  
  // Handle time slider commit (when user releases slider)
  const handleTimeSliderCommit = (event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const value = newValue as number;
    console.log("Setting audio time to:", value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      
      // If audio was paused, keep it paused
      if (isPaused) {
        setTimeSliderValue(value);
        setCurrentTime(value);
      }
    }
  };
  
  // Make sure we have valid results for the current page
  const currentPageData = results[currentPage];
  if (!currentPageData) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading audio player...
      </Typography>
    );
  }
  
  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center">
        <Tooltip title={`${audioPlaying ? 'Pause' : 'Play'} (Space)`}>
          <IconButton
            onClick={() => {
              handlePlayAudio(
                results[currentPage]?.audio || '', 
                results[currentPage]?.audio_url || ''
              );
            }}
            color="primary"
            disabled={isAudioLoading}
          >
            {isAudioLoading ? <CircularProgress size={24} /> : audioPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Replay from beginning">
          <IconButton 
            onClick={handleReplay}
            color="primary"
            disabled={!audioRef.current || isAudioLoading}
          >
            <ReplayOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Time slider with keyboard shortcut info */}
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Tooltip title="Use Left/Right arrow keys to seek 5 seconds">
          <Slider
            ref={sliderRef}
            value={timeSliderValue}
            onChange={handleTimeSliderChange}
            onChangeCommitted={handleTimeSliderCommit}
            min={0}
            max={audioDuration || 100}
            step={0.1}
            aria-labelledby="time-slider"
            disabled={!audioRef.current || isAudioLoading}
          />
        </Tooltip>
      </Box>

      {/* Volume Control with keyboard shortcut info */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Use Up/Down arrow keys to adjust volume">
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <VolumeDown />
            <Slider
              value={volume}
              onChange={(_, newValue) => setVolume(newValue as number)}
              min={0}
              max={1}
              step={0.01}
              aria-labelledby="volume-slider"
              sx={{ mx: 2, flexGrow: 1 }}
            />
            <VolumeUp />
          </Box>
        </Tooltip>
      </Box>

      {/* Playback Speed Control */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SpeedIcon />
        <Slider
          value={playbackRate}
          onChange={(_, newValue) => setPlaybackRate(newValue as number)}
          min={0.5}
          max={2}
          step={0.1}
          aria-labelledby="speed-slider"
          sx={{ mx: 2, flexGrow: 1 }}
          valueLabelDisplay="auto"
          valueLabelFormat={value => `${value}x`}
        />
      </Box>
    </Stack>
  );
};

export default AudioPlayer;