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

  const detect = async () => {
    if (webcamRef.current && model) {
      // Get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set canvas dimensions
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make detection
      const predictions = await model.detect(video);

      // Get canvas context for drawing
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Draw detections
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#00ff00';
        ctx.fillText(
          `${prediction.class} ${Math.round(prediction.score * 100)}%`,
          x,
          y > 10 ? y - 5 : 10
        );
      });

      // Filter predictions based on selected filters
      const filteredPredictions = predictions.filter(pred => 
        selectedFilters.length === 0 || selectedFilters.includes(pred.class)
      );

      // Update detection history
      filteredPredictions.forEach(pred => {
        setDetectionHistory(prev => [{
          object: pred.class,
          confidence: Math.round(pred.score * 100),
          timestamp: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 99)]); // Keep last 100 detections
      });

      // Draw detections with custom styles
      filteredPredictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Add gradient background for text
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y - 20, width, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(
          `${prediction.class} ${Math.round(prediction.score * 100)}%`,
          x + 5,
          y - 5
        );
      });
    }
  };

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

  return (
    <div className="detection-container">
      {isLoading ? (
        <div className="loading">Loading model...</div>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            muted={true}
            className={`webcam ${isDetecting ? 'active' : ''}`}
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