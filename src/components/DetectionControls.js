import React, { useState } from 'react';
import '../styles/DetectionControls.css';

const DetectionControls = ({ 
  onIntervalChange, 
  interval, 
  onScreenshot, 
  onFilterChange, 
  selectedFilters,
  detectionHistory,
  setDetectionHistory
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const commonObjects = ['person', 'car', 'dog', 'cat', 'chair', 'bottle', 'laptop', 'cell phone', 'book'];

  const clearHistory = () => {
    setDetectionHistory([]);
  };

  return (
    <div className={`controls-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="controls-header">
        <h2>Detection Controls</h2>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '↓' : '↑'}
        </button>
      </div>

      <div className="controls-content">
        <div className="control-section">
          <h3>Detection Speed</h3>
          <div className="slider-container">
            <span>{interval}ms</span>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="100" 
              value={interval} 
              onChange={(e) => onIntervalChange(Number(e.target.value))} 
            />
          </div>
        </div>

        <div className="control-section">
          <h3>Object Filters</h3>
          <div className="filters">
            {commonObjects.map(object => (
              <label key={object} className="filter-chip">
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(object)}
                  onChange={() => onFilterChange(object)}
                />
                <span>{object}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="control-actions">
          <button className="action-btn screenshot-btn" onClick={onScreenshot}>
            📸 Take Screenshot
          </button>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h3>Detection History</h3>
            <button className="clear-btn" onClick={clearHistory}>
              Clear
            </button>
          </div>
          <div className="history-list">
            {detectionHistory.map((entry, index) => (
              <div key={index} className="history-item">
                <span className="history-object">{entry.object}</span>
                <span className="history-confidence">{entry.confidence}%</span>
                <span className="history-time">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionControls;