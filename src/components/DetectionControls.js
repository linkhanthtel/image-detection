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
  const [activeTab, setActiveTab] = useState('controls');
  const commonObjects = ['person', 'car', 'dog', 'cat', 'chair', 'bottle', 'laptop', 'cell phone', 'book'];

  const clearHistory = () => {
    setDetectionHistory([]);
  };

  return (
    <div className={`controls-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="controls-header">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Controls
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '⌃' : '⌄'}
        </button>
      </div>

      <div className="controls-content">
        {activeTab === 'controls' ? (
          <>
            <div className="control-section">
              <h3>Detection Speed</h3>
              <div className="slider-container">
                <input 
                  type="range" 
                  min="100" 
                  max="1000" 
                  step="100" 
                  value={interval} 
                  onChange={(e) => onIntervalChange(Number(e.target.value))} 
                />
                <span className="interval-display">{interval}ms</span>
              </div>
            </div>

            <div className="control-section">
              <h3>Object Filters</h3>
              <div className="filters-grid">
                {commonObjects.map(object => (
                  <label key={object} className={`filter-chip ${selectedFilters.includes(object) ? 'active' : ''}`}>
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
                📸 Capture
              </button>
            </div>
          </>
        ) : (
          <div className="history-section">
            <div className="history-header">
              <h3>Detection Log</h3>
              <button className="clear-btn" onClick={clearHistory}>
                Clear All
              </button>
            </div>
            <div className="history-list">
              {detectionHistory.map((entry, index) => (
                <div key={index} className="history-item">
                  <div className="history-item-main">
                    <span className="history-object">{entry.object}</span>
                    <span className="history-confidence">{entry.confidence}%</span>
                  </div>
                  <span className="history-time">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionControls;