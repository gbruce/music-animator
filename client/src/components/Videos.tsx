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

    // ... rest of the video card code ...
  </div>
))} 