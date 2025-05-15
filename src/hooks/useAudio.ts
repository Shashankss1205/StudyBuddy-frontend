import { useState, useRef, useEffect, RefObject } from 'react';
import { PageResult } from '../types';

interface UseAudioResult {
  audioRef: RefObject<HTMLAudioElement | null>;
  playing: boolean;
  currentTime: number;
  duration: number;
  togglePlayPause: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleSeek: (event: Event, newValue: number | number[]) => void;
  handlePlaybackRateChange: (value: number) => void;
  playbackRate: number;
  // Optional backward compatibility for older interface
  audioPlaying?: boolean;
  isPaused?: boolean;
  volume?: number;
  setVolume?: (value: number) => void;
  setPlaybackRate?: (value: number) => void;
  handlePlayAudio?: (audioData: string, audioUrl?: string) => void;
  handleReplay?: () => void;
}

export const useAudio = (audioUrl: string): UseAudioResult => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset state when audio URL changes
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    
    if (!audioUrl) return;
    
    // Check if audio URL is a direct URL or needs the API base URL
    const baseUrl = process.env.REACT_APP_API_URL || 'https://studybuddy-backend-h2b4.onrender.com/';
    const fullAudioUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${baseUrl}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
      
    console.log("Setting audio source to:", fullAudioUrl);
    
    if (audioRef.current) {
      audioRef.current.src = fullAudioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .catch(error => {
          console.error("Error playing audio:", error);
        });
    }
    
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    console.log("Audio loaded, duration:", audioRef.current.duration);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    if (!audioRef.current) return;
    
    const newTime = typeof newValue === 'number' ? newValue : newValue[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  return {
    audioRef,
    playing,
    currentTime,
    duration,
    togglePlayPause,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,
    handlePlaybackRateChange,
    playbackRate
  };
};