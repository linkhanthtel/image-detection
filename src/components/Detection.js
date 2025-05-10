import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import '../styles/Detection.css';
import DetectionControls from './DetectionControls';

const Detection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detectionInterval, setDetectionInterval] = useState(100);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load the detection model
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await cocossd.load();
      setModel(loadedModel);
      setIsLoading(false);
    };
    loadModel();
  }, []);

  // Detect function
  const handleScreenshot = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `detection-${new Date().toISOString()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleFilterChange = (object) => {
    setSelectedFilters(prev => 
      prev.includes(object) 
        ? prev.filter(item => item !== object)
        : [...prev, object]
    );
  };

  // Add new state for detection timing
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const DETECTION_COOLDOWN = 2000; // 2 seconds between detections

  const detect = async () => {
    if (webcamRef.current && model) {
      const currentTime = Date.now();
      if (currentTime - lastDetectionTime < DETECTION_COOLDOWN) {
        return;
      }

      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await model.detect(video);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const topPrediction = predictions
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      const filteredPrediction = topPrediction.filter(pred => 
        selectedFilters.length === 0 || selectedFilters.includes(pred.class)
      );

      if (filteredPrediction.length > 0) {
        const prediction = filteredPrediction[0];
        const [x, y, width, height] = prediction.bbox;
        
        // Enhanced box drawing
        ctx.strokeStyle = '#00fff2';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Calculate object dimensions relative to video size
        const objectWidth = Math.round((width / videoWidth) * 100);
        const objectHeight = Math.round((height / videoHeight) * 100);
        const objectArea = Math.round(objectWidth * objectHeight);
        
        // Create info box
        const infoBoxHeight = 80;
        const gradient = ctx.createLinearGradient(x, y - infoBoxHeight, x + width, y);
        gradient.addColorStop(0, 'rgba(0, 255, 242, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 255, 242, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y - infoBoxHeight, width, infoBoxHeight);
        
        // Draw detailed information
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textBaseline = 'top';
        
        const infoLines = [
          `Object: ${prediction.class}`,
          `Confidence: ${Math.round(prediction.score * 100)}%`,
          `Size: ${objectWidth}% × ${objectHeight}%`,
          `Area: ${objectArea}% of frame`
        ];
        
        infoLines.forEach((line, index) => {
          ctx.fillText(line, x + 5, y - infoBoxHeight + (index * 18) + 5);
        });

        // Draw position indicators
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const relativeX = Math.round((centerX / videoWidth) * 100);
        const relativeY = Math.round((centerY / videoHeight) * 100);

        // Draw crosshair at object center
        ctx.beginPath();
        ctx.strokeStyle = '#00fff2';
        ctx.lineWidth = 1;
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();

        // Update detection history with enhanced information
        setDetectionHistory(prev => [{
          object: prediction.class,
          confidence: Math.round(prediction.score * 100),
          position: `${relativeX}%, ${relativeY}%`,
          size: `${objectWidth}% × ${objectHeight}%`,
          area: `${objectArea}%`,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 99)]);

        setLastDetectionTime(currentTime);
      }
    }
  };

  // Update detection interval effect
  useEffect(() => {
    let interval;
    if (isDetecting && webcamRef.current?.video?.readyState === 4) {
      interval = setInterval(detect, DETECTION_COOLDOWN);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isDetecting, model, selectedFilters, webcamRef.current]);

  const startDetection = () => {
    setIsDetecting(true);
  };

  useEffect(() => {
    let interval;
    if (isDetecting) {
      interval = setInterval(() => {
        detect();
      }, detectionInterval);
    }
    return () => clearInterval(interval);
  }, [model, detectionInterval, selectedFilters, isDetecting]);

  // Add new states for webcam controls
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  // Update webcamConfig state with more size options
  const [webcamConfig, setWebcamConfig] = useState({
    width: 1280,  // Changed default to HD
    height: 720,
    facingMode: 'user',
    mirrored: true,
    aspectRatio: 16/9
  });

  // Update WebcamControls component
  const WebcamControls = ({ cameras, selectedCamera, setSelectedCamera, webcamConfig, setWebcamConfig }) => (
    <div className="webcam-controls">
      {/* <select 
        id="camera-select"
        name="camera-select"
        value={selectedCamera || ''} 
        onChange={(e) => setSelectedCamera(e.target.value)}
      >
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
          </option>
        ))}
      </select> */}
      <select 
        id="resolution-select"
        name="resolution-select"
        value={`${webcamConfig.width}x${webcamConfig.height}`}
        onChange={(e) => {
          const [width, height] = e.target.value.split('x').map(Number);
          const aspectRatio = width / height;
          setWebcamConfig(prev => ({ ...prev, width, height, aspectRatio }));
        }}
      >
        <option value="640x480">480p (4:3)</option>
        <option value="854x480">480p (16:9)</option>
        <option value="1280x720">720p HD</option>
        <option value="1920x1080">1080p Full HD</option>
        <option value="2560x1440">1440p QHD</option>
        <option value="3840x2160">2160p 4K</option>
      </select>
      <select
        id="aspect-ratio-select"
        name="aspect-ratio-select"
        value={webcamConfig.aspectRatio}
        onChange={(e) => {
          const aspectRatio = parseFloat(e.target.value);
          const height = webcamConfig.width / aspectRatio;
          setWebcamConfig(prev => ({ ...prev, aspectRatio, height }));
        }}
      >
        <option value={16/9}>16:9 Widescreen</option>
        <option value={4/3}>4:3 Standard</option>
        <option value={21/9}>21:9 Ultrawide</option>
      </select>
      <button 
        id="mirror-button"
        onClick={() => setWebcamConfig(prev => ({ ...prev, mirrored: !prev.mirrored }))}
      >
        {webcamConfig.mirrored ? 'Unmirror' : 'Mirror'}
      </button>
      <button 
        id="flip-button"
        onClick={() => {
          setWebcamConfig(prev => ({
            ...prev,
            facingMode: prev.facingMode === 'user' ? 'environment' : 'user'
          }));
        }}
      >
        Flip Camera
      </button>
    </div>
  );

  // Update Webcam component
  return (
    <div className="detection-container">
      {isLoading ? (
        <div className="loading">Loading model...</div>
      ) : (
        <>
          <WebcamControls 
            cameras={cameras}
            selectedCamera={selectedCamera}
            setSelectedCamera={setSelectedCamera}
            webcamConfig={webcamConfig}
            setWebcamConfig={setWebcamConfig}
          />
          <Webcam
            ref={webcamRef}
            muted={true}
            className={`webcam ${isDetecting ? 'active' : ''}`}
            videoConstraints={{
              deviceId: selectedCamera,
              width: webcamConfig.width,
              height: webcamConfig.height,
              facingMode: webcamConfig.facingMode,
              aspectRatio: webcamConfig.aspectRatio
            }}
            mirrored={webcamConfig.mirrored}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            onUserMedia={() => {
              if (webcamRef.current?.video) {
                webcamRef.current.video.addEventListener('loadeddata', () => {
                  console.log('Camera ready');
                });
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className={`canvas ${isDetecting ? 'active' : ''}`}
          />
          <button 
            className={`start-button ${isDetecting ? 'hidden' : ''}`}
            onClick={startDetection}
          >
            Start Detection
          </button>
          {isDetecting && (
            <DetectionControls
              interval={detectionInterval}
              onIntervalChange={setDetectionInterval}
              onScreenshot={handleScreenshot}
              onFilterChange={handleFilterChange}
              selectedFilters={selectedFilters}
              detectionHistory={detectionHistory}
              setDetectionHistory={setDetectionHistory}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Detection;