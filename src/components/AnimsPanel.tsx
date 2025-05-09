import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  IconButton,
} from '@mui/material';
import { useAnims } from '../contexts/AnimsContext';
import { createLogger } from '../utils/logger';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { guess as guessBPM } from 'web-audio-beat-detector';
import { TimerOutlined as BPMIcon } from '@mui/icons-material';
import { imageApi, videoApi, Image, segmentApi, Video } from '../services/api';
import { createOneShotAnimation, AnimationConfig, OneShotAnimation, CreateOneShotAnimationParams } from '../types/oneShotAnimation';
import { runAnimationWorkflow } from '../comfy/utils';
import { ArrowUpward as ArrowUpwardIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useProjects } from '../contexts/ProjectContext';
import { useVideo } from '../contexts/VideoContext';

// Create a logger instance for this component
const logger = createLogger('AnimsPanel.tsx');

// Create a function to handle the animation creation
async function createAnimation(bpm: number, totalDurationSeconds: number): Promise<OneShotAnimation> {
  const config: AnimationConfig = {
    bpm,
    orientation: 'portrait', // TODO: Make this configurable
    totalDurationSeconds,
    beatInterval: 8 // TODO: Make this configurable
  };

  const params: CreateOneShotAnimationParams = {
    config,
    imageService: {
      getRandomImages: imageApi.getRandomImages.bind(imageApi)
    }
  };

  return createOneShotAnimation(params);
}

// Add Segment type locally
interface Segment {
  id: string;
  projectId: string;
  startFrame: number;
  duration: number;
  images: Image[];
  createdAt: string;
  updatedAt: string;
  draftVideoId?: string;
  upscaleVideoId?: string;
}

// AuthenticatedThumbnail component for video thumbnails
const AuthenticatedThumbnail: React.FC<{ identifier: string; alt?: string; style?: React.CSSProperties }> = ({ identifier, alt, style }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    const fetchThumbnail = async () => {
      const url = videoApi.getVideoThumbnailUrl(identifier);
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        if (!revoked) setSrc(objectUrl);
      } else {
        if (!revoked) setSrc(null);
      }
    };
    fetchThumbnail();
    return () => {
      revoked = true;
      if (src) URL.revokeObjectURL(src);
    };
  }, [identifier]);

  if (!src) return <div style={{ ...style, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>No Thumbnail</div>;
  return <img src={src} alt={alt} style={{ ...style, objectFit: 'cover', aspectRatio: '1/1' }} />;
};

// VideoSelectorModal component
const VideoSelectorModal: React.FC<{
  onClose: () => void;
  onSelect: (video: Video) => void;
}> = ({ onClose, onSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videoList = await videoApi.list();
        setVideos(videoList);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }} onClick={onClose}>
      <div style={{
        background: '#1A202C',
        borderRadius: '8px',
        border: '1px solid #4A5568',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 0 24px' }}>
          <h2 style={{ color: '#E2E8F0', marginBottom: '16px' }}>Select Flow Video</h2>
          
          {loading ? (
            <div style={{ color: '#E2E8F0', padding: '16px' }}>Loading videos...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 180px)' // Account for header and footer
            }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    border: selectedVideo?.id === video.id ? '2px solid #4299E1' : '1px solid #4A5568',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    background: selectedVideo?.id === video.id ? '#2D3748' : '#1A202C',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <AuthenticatedThumbnail
                    identifier={video.identifier}
                    alt={video.filename}
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{
                    color: '#E2E8F0',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {video.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          background: '#1A202C',
          borderTop: '1px solid #4A5568',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#2D3748',
              color: '#E2E8F0',
              border: '1px solid #4A5568',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => selectedVideo && onSelect(selectedVideo)}
            disabled={!selectedVideo}
            style={{
              padding: '8px 16px',
              background: selectedVideo ? '#4299E1' : '#2D3748',
              color: '#E2E8F0',
              border: '1px solid #4A5568',
              borderRadius: '4px',
              cursor: selectedVideo ? 'pointer' : 'not-allowed',
              opacity: selectedVideo ? 1 : 0.5
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

const AnimsPanel: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ max: number; value: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [animationDuration, setAnimationDuration] = useState<number>(10);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [duration, setDuration] = useState<number>(10);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [upscaleUrl, setUpscaleUrl] = useState<string | null>(null);
  const [upscaleLoading, setUpscaleLoading] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [flowVideo, setFlowVideo] = useState<Video | null>(null);
  const [segmentCount, setSegmentCount] = useState<number>(1);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartValue = useRef<number>(1);
  
  // Use context for managing state
  const { 
    sourceAnim,
    setSourceAnim,
    generatedAnims,
    setGeneratedAnims
  } = useAnims();

  const { currentProject } = useProjects();
  const { videos, fetchVideos } = useVideo();

  useEffect(() => {
    if (currentProject?.id) {
      segmentApi.getSegmentsByProjectId(currentProject.id).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    let revokedUrl: string | null = null;
    const fetchVideoUrl = async () => {
      setVideoUrl(null);
      setVideoLoading(false);
      if (!selectedSegment) return;
      const videoId = selectedSegment.draftVideoId;
      const videoObj = videos.find(v => v.identifier === videoId);
      if (videoObj) {
        setVideoLoading(true);
        try {
          const url = await videoApi.getVideoUrl(videoObj.identifier);
          setVideoUrl(url);
          revokedUrl = url;
        } finally {
          setVideoLoading(false);
        }
      }
    };
    fetchVideoUrl();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [selectedSegment, videos]);

  useEffect(() => {
    let revokedUrl: string | null = null;
    const upscaleVideoId = selectedSegment?.upscaleVideoId;
    const upscaleVideoObj = videos.find(v => v.identifier === upscaleVideoId);
    if (upscaleVideoObj) {
      setUpscaleLoading(true);
      videoApi.getVideoUrl(upscaleVideoObj.identifier).then(url => {
        setUpscaleUrl(url);
        revokedUrl = url;
      }).finally(() => setUpscaleLoading(false));
    } else {
      setUpscaleUrl(null);
    }
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [selectedSegment, videos]);

  // Add segments and handleDeleteSegment as local state and function
  const handleDeleteSegment = async (segmentId: string) => {
    try {
      await segmentApi.deleteSegment(segmentId);
      setSegments(prev => prev.filter(s => s.id !== segmentId));
      if (selectedSegment?.id === segmentId) setSelectedSegment(null);
    } catch (err) {
      // Optionally show error
      console.error('Failed to delete segment', err);
    }
  };

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Use only the first file and ensure it's an audio file
    const file = files[0];
    if (!file.type.startsWith('audio/')) {
      logger.error('Dropped file is not an audio file (MP3/WAV)');
      return;
    }
    
    // Create URL for the audio preview
    const audioUrl = URL.createObjectURL(file);
    setSourceAnim(audioUrl);
    setAudioFile(file);
    logger.log(`Source audio set: ${file.name}`);
  }, [setSourceAnim]);
  
  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  // Handle file selection via click
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file selection change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('audio/')) {
      logger.error('Selected file is not an audio file (MP3/WAV)');
      return;
    }
    
    // Clean up any existing source animation URL
    if (sourceAnim) {
      URL.revokeObjectURL(sourceAnim);
    }

    // Reset BPM when new file is selected
    setDetectedBPM(null);

    // Create URL for the audio preview
    const audioUrl = URL.createObjectURL(file);
    setSourceAnim(audioUrl);
    setAudioFile(file);
    logger.log(`Source audio set: ${file.name}`);
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }, [sourceAnim, setSourceAnim]);

  const handleGenerateAnimation = useCallback(async () => {
    if (!sourceAnim || !audioFile) return;
    try {
      setIsGenerating(true);
      logger.log('Starting BPM detection...');

      // Create AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Fetch the audio file
      const response = await fetch(sourceAnim);
      const arrayBuffer = await response.arrayBuffer();

      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // Detect BPM
      const result = await guessBPM(audioBuffer);

      let bpm: number | null = null;
      if (typeof result.bpm === 'number' && result.bpm > 0) {
        bpm = result.bpm;
        setDetectedBPM(bpm);
        logger.log(`Detected BPM: ${bpm}`);
      } else {
        logger.error('Could not detect BPM');
        setDetectedBPM(null);
        setIsGenerating(false);
        return;
      }

      logger.log('Starting animation generation...');
      // Create the one shot animation
      const animation = await createAnimation(bpm, duration);
      logger.log(`Animation sequence created:  ${JSON.stringify(animation)}`);

      // Process each segment with ComfyUI
      for (const segment of animation.segments) {
        logger.log(`Processing segment starting at frame ${segment.startFrame}`);
        let response;
        try {
          response = await runAnimationWorkflow(
            segment.startFrame,
            segment.images,
            segment.durationInFrames,
            audioFile,
            (max, value) => {
              setGenerationProgress({ max, value });
            },
            undefined,
            flowVideo?.identifier,
          );

          // Upload the returned video and image blobs to the API
          if (response && response.videoUrl && response.workflowUrl && response.promptId) {
            const filenameBase = `${response.promptId}-${segment.startFrame}-${segment.durationInFrames}`;

            // Fetch blobs from object URLs
            const videoBlob = await fetch(response.videoUrl).then(r => r.blob());

            // Upload video
            const video = await videoApi.uploadGeneratedVideo(videoBlob, `${filenameBase}.mp4`);
            logger.log(`Uploaded video: ${video.identifier}`);

            await fetchVideos();

            // Create segment with video as draftVideo
            try {
              if (!currentProject?.id) throw new Error('No project selected');
              const createdSegment = await segmentApi.createSegment({
                projectId: currentProject.id,
                startFrame: segment.startFrame,
                duration: segment.durationInFrames,
                images: segment.images.map(img => img.id),
                draftVideo: video.identifier,
              });
              logger.log(`Created segment: ${createdSegment.id}`);
              setSegments(prev => [...prev, createdSegment]);
            } catch (err) {
              logger.error('Error creating segment:', err);
            }
          }

          // Add the generated animation to the list
          // TODO: Get the actual URL from the ComfyUI response
          setGeneratedAnims(prev => [...prev, {
            url: 'placeholder-url',
            added: false,
            selected: false
          }]);
        } catch (error) {
          logger.error('Error processing segment:', error);
          // Continue with other segments even if one fails
        }
      }

      logger.log('Animation generation completed');
    } catch (error) {
      logger.error('Animation generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [sourceAnim, audioFile, setGeneratedAnims, duration]);

  // Add handleUpscale function
  const handleUpscale = useCallback(async () => {
    if (selectedSegment && audioFile) {
      logger.log(`Starting upscale for segment: ${JSON.stringify(selectedSegment)}`);
      
      try {
        const response = await runAnimationWorkflow(
          selectedSegment.startFrame,
          selectedSegment.images,
          selectedSegment.duration,
          audioFile,
          (max, value) => {
            setGenerationProgress({ max, value });
          },
          selectedSegment.draftVideoId,
          flowVideo?.identifier,
        );

        if (response && response.videoUrl && response.workflowUrl && response.promptId) {
          const filenameBase = `${response.promptId}-${selectedSegment.startFrame}-${selectedSegment.duration}`;

          // Fetch blobs from object URLs
          const videoBlob = await fetch(response.videoUrl).then(r => r.blob());

          // Upload video
          const video = await videoApi.uploadGeneratedVideo(videoBlob, `${filenameBase}-upscaled.mp4`);
          logger.log(`Uploaded upscaled video: ${video.identifier}`);

          await fetchVideos();

          // Update segment with upscaled video
          try {
            if (!currentProject?.id) throw new Error('No project selected');
            const updatedSegment = await segmentApi.updateSegment(selectedSegment.id, {
              upscaleVideoId: video.identifier,
            });
            logger.log(`Updated segment with upscaled video: ${updatedSegment.id}`);
            setSegments(prev => prev.map(s => s.id === updatedSegment.id ? updatedSegment : s));
          } catch (err) {
            logger.error('Error updating segment with upscaled video:', err);
          }
        }
      } catch (error) {
        logger.error('Error during upscale workflow:', error);
      }
    }
  }, [selectedSegment, audioFile, currentProject?.id, videos]);

  // Drag handlers for segment number picker
  const handleSegmentDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    dragStartX.current = e.clientX;
    dragStartValue.current = segmentCount;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (dragStartX.current !== null) {
        const dx = ev.clientX - dragStartX.current;
        const delta = Math.round(dx / 20);
        let newValue = dragStartValue.current + delta;
        newValue = Math.max(1, Math.min(20, newValue));
        setSegmentCount(newValue);
      }
    };
    const handleMouseUp = () => {
      dragStartX.current = null;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 182px)', maxHeight: 'calc(100vh - 182px)', background: '#121212', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Top: Audio Drop Target & Quick Menu */}
      <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #444', padding: 16, gap: 16, flex: '0 0 auto', overflow: 'hidden', boxSizing: 'border-box', background: '#121212' }}>
        {/* Audio Drop Target */}
        <div
          style={{
            flex: 1,
            minWidth: 320,
            maxWidth: 400,
            border: '1px dashed #444',
            borderRadius: 8,
            background: isDragging ? '#222' : '#181818',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
            cursor: 'pointer',
            transition: 'background 0.2s',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="audio/*"
          />
          {audioFile ? (
            <span>{audioFile.name}</span>
          ) : (
            <span>Drop audio file or click to select</span>
          )}
        </div>
        {/* Quick Menu */}
        <div style={{ 
          flex: 1, 
          minWidth: 320, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16, 
          background: '#181818', 
          padding: '8px 24px 16px 24px', 
          overflow: 'hidden', 
          boxSizing: 'border-box', 
          border: '1px solid #444', 
          fontSize: '14pt' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ color: '#aaa', fontSize: 12, marginLeft: 2, marginBottom: 2, fontFamily: 'Roboto, Arial, sans-serif' }}>Segment</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#222',
                border: '1px solid #444',
                borderRadius: 6,
                height: 36,
                minWidth: 90,
                maxWidth: 110,
                fontSize: 16,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setSegmentCount(v => Math.max(1, v - 1))}
                  style={{
                    width: 32,
                    height: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: 20,
                    cursor: 'pointer',
                    outline: 'none',
                    backgroundColor: '#181818',
                    transition: 'background 0.2s',
                  }}
                  aria-label="decrement"
                  tabIndex={0}
                >
                  -
                </button>
                <div
                  ref={dragRef}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: '#fff',
                    background: 'none',
                    fontWeight: 500,
                    fontSize: 16,
                    userSelect: 'none',
                    letterSpacing: 1,
                    cursor: 'ew-resize',
                  }}
                  onMouseDown={handleSegmentDragMouseDown}
                  title="Drag left/right to change"
                >
                  {segmentCount}
                </div>
                <button
                  onClick={() => setSegmentCount(v => Math.min(20, v + 1))}
                  style={{
                    width: 32,
                    height: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: 20,
                    cursor: 'pointer',
                    outline: 'none',
                    backgroundColor: '#181818',
                    transition: 'background 0.2s',
                  }}
                  aria-label="increment"
                  tabIndex={0}
                >
                  +
                </button>
              </div>
            </div>
            {/* Duration with custom label for alignment */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ color: '#aaa', fontSize: 12, marginLeft: 2, marginBottom: 2, fontFamily: 'Roboto, Arial, sans-serif' }}>Duration</span>
              <TextField
                // label="Duration"
                type="number"
                size="small"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                inputProps={{ min: 1 }}
                sx={{ width: 100, background: '#222', borderRadius: 1, input: { color: '#fff' }, label: { color: '#aaa' } }}
              />
            </div>
            <Button variant="contained" color="primary" onClick={handleGenerateAnimation} sx={{ minWidth: 100 }} disabled={!audioFile}>Generate</Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <Button
                variant="outlined"
                onClick={() => setShowVideoSelector(true)}
                sx={{ 
                  color: '#fff', 
                  borderColor: '#444',
                  '&:hover': { borderColor: '#666' }
                }}
              >
                Select Flow Video
              </Button>
              {flowVideo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AuthenticatedThumbnail
                    identifier={flowVideo.identifier}
                    alt={flowVideo.filename}
                    style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid #444' }}
                  />
                  <Typography variant="body2" style={{ color: '#aaa', fontSize: '12px' }}>
                    {flowVideo.filename}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVideoSelector && (
        <VideoSelectorModal
          onClose={() => setShowVideoSelector(false)}
          onSelect={(video) => {
            setFlowVideo(video);
            setShowVideoSelector(false);
          }}
        />
      )}

      {/* Main Content: Segments List & Preview */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden', boxSizing: 'border-box', background: '#121212' }}>
        {/* Left: Segments List */}
        <div style={{ width: 480, background: '#181818', padding: 24, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxSizing: 'border-box', borderRight: '1px solid #444', fontSize: '14pt' }}>
          <Typography variant="h5" style={{ color: '#fff', marginBottom: 16, flex: '0 0 auto', fontWeight: 700, letterSpacing: 1 }}>Segments</Typography>
          <div style={{ flex: 1, minHeight: 0, height: '100%', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', paddingBottom: 24, border: '1px solid #444', background: '#121212', padding: 16, fontSize: '14pt' }}>
            {segments.map((segment: Segment) => (
              <div
                key={segment.id}
                style={{
                  marginBottom: 20,
                  background: '#181818',
                  border: selectedSegment?.id === segment.id ? '1.5px solid #0ff' : '1px solid #444',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '14px',
                  width: '100%'
                }}
                onClick={() => setSelectedSegment(segment)}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {/* Video Thumbnail */}
                  {segment.draftVideoId ? (
                    <AuthenticatedThumbnail
                      identifier={segment.draftVideoId}
                      alt="segment video thumbnail"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #444', background: '#000' }}
                    />
                  ) : (
                    <Box width={80} height={80} borderRadius={8} border="1px solid #444" bgcolor="#222" display="flex" alignItems="center" justifyContent="center">
                      <Typography color="#fff" variant="caption">No Video</Typography>
                    </Box>
                  )}
                  {/* Images Thumbnails */}
                  <Box flex={1}>
                    <Typography style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Start: <span style={{ color: '#fff', fontWeight: 400, fontSize: '14px' }}>{segment.startFrame}</span></Typography>
                    <Typography style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Duration: <span style={{ color: '#fff', fontWeight: 400, fontSize: '14px' }}>{segment.duration}</span></Typography>
                    <Box display="flex" mt={1} gap={1}>
                      {segment.images.map((img: Image, idx: number) => (
                        img.identifier ? (
                          <img
                            key={img.id}
                            src={imageApi.getImageUrl(img.identifier)}
                            alt="segment img"
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #444', background: '#000' }}
                          />
                        ) : null
                      ))}
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="center" ml={2} gap={1}>
                    <IconButton 
                      size="small" 
                      style={{ color: '#fff', border: '1px solid #444', background: '#222' }} 
                      onClick={e => { e.stopPropagation(); handleDeleteSegment(segment.id); }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </div>
            ))}
          </div>
        </div>
        {/* Right: Segment Preview */}
        <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#121212', minHeight: 0, height: '100%', overflow: 'hidden', boxSizing: 'border-box', paddingBottom: 24 }}>
          {selectedSegment && (() => {
            let previewContent: React.ReactNode = null;
            const draftVideoId = selectedSegment.draftVideoId;
            const upscaleVideoId = selectedSegment.upscaleVideoId;
            const draftVideoObj = videos.find(v => v.identifier === draftVideoId);
            const upscaleVideoObj = videos.find(v => v.identifier === upscaleVideoId);

            if (draftVideoObj) {
              previewContent = (
                <div style={{ display: 'flex', flexDirection: 'row', gap: 32 }}>
                  {/* Draft Video */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: '#bbb', fontSize: 13, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Draft</div>
                    {videoLoading ? (
                      <div style={{ color: '#fff', padding: 32 }}>Loading video...</div>
                    ) : videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        style={{ width: 260, height: 480, objectFit: 'cover', border: '1px solid #444', background: '#000', display: 'block', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ color: '#fff', padding: 32 }}>No video available</div>
                    )}
                  </div>
                  {/* Upscaled Video */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: '#bbb', fontSize: 13, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Upscaled</div>
                    {upscaleVideoObj ? (
                      upscaleLoading ? (
                        <div style={{ color: '#fff', padding: 32 }}>Loading video...</div>
                      ) : upscaleUrl ? (
                        <video
                          src={upscaleUrl}
                          controls
                          style={{ width: 260, height: 480, objectFit: 'cover', border: '1px solid #444', background: '#000', display: 'block', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <div style={{ width: 260, height: 480, background: '#222', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            sx={{ minWidth: 100, fontSize: 16, padding: '8px 24px', borderRadius: 2 }}
                            onClick={handleUpscale}
                          >
                            Upscale
                          </Button>
                        </div>
                      )
                    ) : (
                      <div style={{ width: 260, height: 480, background: '#222', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          sx={{ minWidth: 100, fontSize: 16, padding: '8px 24px', borderRadius: 2 }}
                          onClick={handleUpscale}
                        >
                          Upscale
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (selectedSegment.images[0]) {
              previewContent = (
                <img
                  src={`/images/${selectedSegment.images[0].identifier}`}
                  alt="segment preview large"
                  style={{ maxHeight: 480, maxWidth: '100%', width: 260, objectFit: 'cover', border: '1px solid #444', background: '#000', display: 'block', boxSizing: 'border-box' }}
                />
              );
            }
            return previewContent;
          })()}
        </div>
      </div>
    </div>
  );
};

export default AnimsPanel;