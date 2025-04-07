import React, { useState, useEffect, useRef } from 'react';
import { useVideo } from '../contexts/VideoContext';
import { useFolder } from '../contexts/FolderContext';
import { FolderBrowser } from './FolderBrowser';

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
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <button onClick={() => fileInputRef.current?.click()}>
          Upload Video
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="video/*"
          style={{ display: 'none' }}
        />
        <input
          type="text"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          style={{ padding: '4px 8px' }}
        />
        <button
          onClick={handleYouTubeDownload}
          disabled={isDownloading}
          style={{ backgroundColor: isDownloading ? '#ccc' : '#ff0000', color: 'white' }}
        >
          {isDownloading ? 'Downloading...' : 'Download from YouTube'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <FolderBrowser
            folders={folders}
            currentFolder={currentFolder}
            onFolderSelect={setCurrentFolder}
            onMove={handleMove}
          />
        </div>

        <div style={{ flex: 3 }}>
          {loading ? (
            <div style={{ width: '100%', height: '4px', backgroundColor: '#f0f0f0' }}>
              <div
                style={{
                  width: '30%',
                  height: '100%',
                  backgroundColor: '#0066cc',
                  animation: 'progress 1s infinite linear'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{video.filename}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Duration: {Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                      {video.youtubeInfo && typeof video.youtubeInfo === 'object' && (
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          From YouTube: {
                            typeof video.youtubeInfo.title === 'string' ? video.youtubeInfo.title : 'Untitled'
                          } by {
                            typeof video.youtubeInfo.author === 'string' ? video.youtubeInfo.author : 'Unknown'
                          }
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => window.open(`/videos/${video.identifier}`)}>
                        ⬇️
                      </button>
                      <button
                        onClick={() => handleDelete(video.identifier)}
                        style={{ color: '#ff0000' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {downloadProgress[video.identifier] !== undefined && (
                    <div style={{ marginTop: '8px', width: '100%', height: '4px', backgroundColor: '#f0f0f0' }}>
                      <div
                        style={{
                          width: `${downloadProgress[video.identifier]}%`,
                          height: '100%',
                          backgroundColor: '#0066cc'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}
      </style>
    </div>
  );
}; 