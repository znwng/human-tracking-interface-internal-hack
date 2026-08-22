import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [trackedHumans, setTrackedHumans] = useState([
    { id: 1, activity: 'Walking', confidence: 0.95, lastSeen: '2s ago' },
    { id: 2, activity: 'Standing', confidence: 0.87, lastSeen: '5s ago' },
    { id: 3, activity: 'Running', confidence: 0.92, lastSeen: '1s ago' },
  ])

  const [coordinates, setCoordinates] = useState({
    x1: 200,
    y1: 300,
    x2: 500,
    y2: 600
  })

  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (videoLoaded && canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const wrapper = video.parentElement

      const updateCanvas = () => {
        // Get the actual displayed dimensions and position of the video
        const videoRect = video.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()

        // Calculate the video's displayed size with object-fit: contain
        const videoAspect = video.videoWidth / video.videoHeight
        const containerAspect = videoRect.width / videoRect.height

        let displayWidth, displayHeight, offsetX, offsetY

        if (videoAspect > containerAspect) {
          // Video is wider than container - width is constrained
          displayWidth = videoRect.width
          displayHeight = videoRect.width / videoAspect
          offsetX = 0
          offsetY = (videoRect.height - displayHeight) / 2
        } else {
          // Video is taller than container - height is constrained
          displayHeight = videoRect.height
          displayWidth = videoRect.height * videoAspect
          offsetX = (videoRect.width - displayWidth) / 2
          offsetY = 0
        }

        // Position canvas exactly where the video is
        canvas.style.position = 'absolute'
        canvas.style.left = `${videoRect.left - wrapperRect.left}px`
        canvas.style.top = `${videoRect.top - wrapperRect.top}px`
        canvas.style.width = `${videoRect.width}px`
        canvas.style.height = `${videoRect.height}px`
        canvas.style.transform = 'none'

        // Set canvas internal dimensions to match video displayed dimensions
        canvas.width = videoRect.width
        canvas.height = videoRect.height

        // Store the video display info for drawing
        canvas.videoDisplayInfo = {
          displayWidth,
          displayHeight,
          offsetX,
          offsetY,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        }

        drawBoundingBox()
      }

      updateCanvas()

      const resizeObserver = new ResizeObserver(updateCanvas)
      resizeObserver.observe(wrapper)

      return () => resizeObserver.disconnect()
    }
  }, [videoLoaded, coordinates])

  const drawBoundingBox = () => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.videoDisplayInfo) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const { displayWidth, displayHeight, offsetX, offsetY, videoWidth, videoHeight } = canvas.videoDisplayInfo

    // Calculate scale from video coordinates to displayed video coordinates
    const scale = displayWidth / videoWidth

    // Scale coordinates to displayed video dimensions
    const scaledX1 = coordinates.x1 * scale + offsetX
    const scaledY1 = coordinates.y1 * scale + offsetY
    const scaledX2 = coordinates.x2 * scale + offsetX
    const scaledY2 = coordinates.y2 * scale + offsetY

    // Draw rectangle
    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 3
    ctx.strokeRect(
      scaledX1,
      scaledY1,
      scaledX2 - scaledX1,
      scaledY2 - scaledY1
    )

    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(233, 69, 96, 0.2)'
    ctx.fillRect(
      scaledX1,
      scaledY1,
      scaledX2 - scaledX1,
      scaledY2 - scaledY1
    )
  }

  const handleVideoLoad = () => {
    setVideoLoaded(true)
  }

  const handleCoordinateChange = (field, value) => {
    setCoordinates(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }))
  }

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file)
      videoRef.current.src = url
      setVideoLoaded(true)
    }
  }

  return (
    <div className="app-container">
      <div className="video-section">
        <h2 className="section-title">Video Feed</h2>
        <div className="video-controls">
          <label className="upload-btn">
            Upload Video
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
          </label>
          <div className="coordinate-inputs">
            <div className="coord-group">
              <label>Corner 1 (x1, y1):</label>
              <input
                type="number"
                value={coordinates.x1}
                onChange={(e) => handleCoordinateChange('x1', e.target.value)}
                placeholder="x1"
              />
              <input
                type="number"
                value={coordinates.y1}
                onChange={(e) => handleCoordinateChange('y1', e.target.value)}
                placeholder="y1"
              />
            </div>
            <div className="coord-group">
              <label>Corner 2 (x2, y2):</label>
              <input
                type="number"
                value={coordinates.x2}
                onChange={(e) => handleCoordinateChange('x2', e.target.value)}
                placeholder="x2"
              />
              <input
                type="number"
                value={coordinates.y2}
                onChange={(e) => handleCoordinateChange('y2', e.target.value)}
                placeholder="y2"
              />
            </div>
          </div>
        </div>
        <div className="video-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              className="video-element"
              onLoadedMetadata={handleVideoLoad}
              controls
              muted
              loop
              autoPlay
              style={{ display: videoLoaded ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="canvas-overlay"
            />
          </div>
          {!videoLoaded && (
            <div className="video-placeholder">
              <p>Upload a video to test bounding boxes</p>
              <p className="sub-text">Or use the default test video</p>
            </div>
          )}
        </div>
      </div>

      <div className="tracking-section">
        <h2 className="section-title">Detected Humans</h2>
        <div className="tracking-list">
          {trackedHumans.map((human) => (
            <div key={human.id} className="tracking-card">
              <div className="card-header">
                <span className="human-id">ID: {human.id}</span>
                <span className={`activity-badge ${human.activity.toLowerCase()}`}>
                  {human.activity}
                </span>
              </div>
              <div className="card-details">
                <div className="detail-item">
                  <span className="detail-label">Confidence:</span>
                  <span className="detail-value">{(human.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Seen:</span>
                  <span className="detail-value">{human.lastSeen}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
