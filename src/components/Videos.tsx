import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { useVideo } from '../contexts/VideoContext';
import { useFolder } from '../contexts/FolderContext';
import { FolderBrowser } from './FolderBrowser';

const VideoDropTarget: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontSize: '24px',
      gap: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ fontSize: '64px', opacity: 0.9 }}>🎥</div>
      <div style={{ fontWeight: 300 }}>Drop MP4 videos to upload</div>
    </div>
  );
};

export const Videos: React.FC = () => {
  const {
    videos,
    loading,
    currentFolder,
    setCurrentFolder,
    fetchVideos,
    uploadVideo,
    downloadYouTubeVideo,
    deleteVideo,
    moveVideos,
    downloadProgress
  } = useVideo();

  const { folders } = useFolder();
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVideos(currentFolder || undefined);
  }, [currentFolder, fetchVideos]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadVideo(file, currentFolder || undefined);
      alert('Video uploaded successfully');
    } catch (error) {
      alert('Failed to upload video');
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => 
      file.type === 'video/mp4' || 
      file.name.toLowerCase().endsWith('.mp4')
    );

    if (videoFiles.length === 0) {
      alert('Please drop MP4 video files only');
      return;
    }

    try {
      for (const file of videoFiles) {
        await uploadVideo(file, currentFolder || undefined);
      }
      alert(`Successfully uploaded ${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''}`);
    } catch (error) {
      alert('Failed to upload one or more videos');
    }
  };

  const handleYouTubeDownload = async () => {
    if (!youtubeUrl) return;
    setIsDownloading(true);

    try {
      await downloadYouTubeVideo(youtubeUrl, currentFolder || undefined);
      setYoutubeUrl('');
      alert('Video downloaded successfully');
    } catch (error) {
      alert('Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (identifier: string) => {
    try {
      await deleteVideo(identifier);
      alert('Video deleted successfully');
    } catch (error) {
      alert('Failed to delete video');
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (selectedVideos.length === 0) return;

    try {
      await moveVideos(selectedVideos, folderId);
      setSelectedVideos([]);
      alert('Videos moved successfully');
    } catch (error) {
      alert('Failed to move videos');
    }
  };

  return (
    <div 
      style={{ 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#1A202C'
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <VideoDropTarget visible={isDragging} />
      
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '6px 12px',
            backgroundColor: '#2D3748',
            color: '#E2E8F0',
            border: '1px solid #4A5568',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          Upload Video
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="video/mp4"
          style={{ display: 'none' }}
        />
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flex: 1,
          maxWidth: '600px',
          backgroundColor: '#2D3748',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #4A5568'
        }}>
          <input
            type="text"
            placeholder="Paste YouTube URL here"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{ 
              padding: '4px 8px',
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '13px',
              backgroundColor: 'transparent',
              color: '#E2E8F0'
            }}
          />
          <button
            onClick={handleYouTubeDownload}
            disabled={isDownloading}
            style={{
              padding: '4px 10px',
              backgroundColor: isDownloading ? '#4A5568' : '#2D3748',
              color: '#E2E8F0',
              border: '1px solid #4A5568',
              borderRadius: '4px',
              cursor: isDownloading ? 'default' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }

          .video-card {
            border: 1px solid #4A5568;
            border-radius: 8px;
            overflow: hidden;
            background-color: #2D3748;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
          }

          .video-card:hover {
            transform: translateY(-1px);
            border-color: #718096;
          }

          .video-card .actions {
            opacity: 0;
            transition: opacity 0.15s ease;
          }

          .video-card:hover .actions {
            opacity: 1;
          }

          .drop-zone {
            position: relative;
            background-color: #2D3748;
            border-radius: 8px;
            border: 1px solid #4A5568;
          }

          .drop-zone.dragging::after {
            content: 'Drop MP4 videos here';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(45, 55, 72, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: '13px';
            color: #E2E8F0;
            z-index: 1000;
            border-radius: 8px;
            border: 2px dashed #718096;
          }

          button:hover {
            border-color: #718096;
          }

          ::placeholder {
            color: #718096;
            opacity: 1;
          }
        `}
      </style>

      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'flex-start',
        flex: 1,
        minHeight: 0
      }}>
        <div style={{ 
          flex: 1,
          backgroundColor: '#2D3748',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #4A5568',
        }}>
          <FolderBrowser
            folders={folders}
            currentFolder={currentFolder}
            onFolderSelect={setCurrentFolder}
            onMove={handleMove}
          />
        </div>

        <div 
          style={{ 
            flex: 3,
            minHeight: 0,
            backgroundColor: '#2D3748',
            borderRadius: '8px',
            border: '1px solid #4A5568',
            overflow: 'auto'
          }}
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        >
          {loading ? (
            <div style={{ padding: '12px' }}>
              <div style={{ width: '100%', height: '2px', backgroundColor: '#4A5568', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '30%',
                    height: '100%',
                    backgroundColor: '#718096',
                    animation: 'progress 1s infinite linear'
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
              padding: '12px'
            }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="video-card"
                >
                  <div style={{
                    position: 'relative',
                    paddingTop: '56.25%',
                    backgroundColor: '#1A202C',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '24px',
                      opacity: 0.3
                    }}>
                      🎥
                    </div>
                    {downloadProgress[video.identifier] !== undefined && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: '#4A5568'
                      }}>
                        <div style={{
                          width: `${downloadProgress[video.identifier]}%`,
                          height: '100%',
                          backgroundColor: '#718096',
                          transition: 'width 0.2s ease'
                        }} />
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '10px' }}>
                    <div style={{
                      fontWeight: 500,
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#E2E8F0',
                      fontSize: '13px'
                    }}>
                      {video.filename}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#A0AEC0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ opacity: 0.5 }}>⏱️</span>
                      {Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                    {video.youtubeInfo && typeof video.youtubeInfo === 'object' && (
                      <div style={{
                        fontSize: '12px',
                        color: '#A0AEC0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px'
                      }}>
                        {typeof video.youtubeInfo.title === 'string' ? video.youtubeInfo.title : 'Untitled'}
                      </div>
                    )}
                  </div>

                  <div className="actions" style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    display: 'flex',
                    gap: '4px',
                    background: 'rgba(45, 55, 72, 0.95)',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #4A5568'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/videos/${video.identifier}`);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '14px',
                        opacity: 0.7,
                        color: '#E2E8F0'
                      }}
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(video.identifier);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '14px',
                        opacity: 0.7,
                        color: '#E2E8F0'
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 