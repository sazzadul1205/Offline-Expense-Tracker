// src/components/LoadingScreen.jsx

import { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';

export default function LoadingScreen({ minDisplayTime = 1500 }) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const texts = [
      'Initializing...',
      'Loading database...',
      'Setting up accounts...',
      'Preparing categories...',
      'Almost ready...',
      'Starting up...'
    ];

    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setLoadingText(texts[textIndex]);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Animated Logo */}
        <div className="loading-logo">
          <div className="loading-icon">
            <span className="loading-emoji">💰</span>
          </div>
          <div className="loading-brand">
            <h1 className="loading-title">Expense Tracker</h1>
            <p className="loading-subtitle">Offline · Secure</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <div
              className="loading-progress-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="loading-progress-text">
            {Math.min(Math.floor(progress), 100)}%
          </div>
        </div>

        {/* Loading Text */}
        <div className="loading-message">
          <FiLoader className="loading-spinner" />
          <span>{loadingText}</span>
        </div>

        {/* Tips */}
        <div className="loading-tips">
          <p className="tips-text">💡 Tip: You can swipe left/right to navigate between pages</p>
        </div>
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.5s ease;
        }

        .loading-container {
          text-align: center;
          padding: 20px;
          width: 90%;
          max-width: 320px;
        }

        .loading-logo {
          margin-bottom: 40px;
          animation: slideUp 0.6s ease;
        }

        .loading-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: pulse 1.5s ease infinite;
        }

        .loading-emoji {
          font-size: 48px;
          animation: bounce 0.8s ease infinite;
        }

        .loading-brand {
          color: white;
        }

        .loading-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .loading-subtitle {
          font-size: 12px;
          opacity: 0.8;
          margin: 0;
        }

        .loading-progress-container {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 12px 16px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }

        .loading-progress-bar {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .loading-progress-fill {
          background: linear-gradient(90deg, #fff, #e0e7ff);
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .loading-progress-text {
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }

        .loading-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: white;
          font-size: 14px;
          margin-bottom: 40px;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 12px;
          backdrop-filter: blur(5px);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .loading-tips {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          backdrop-filter: blur(5px);
        }

        .tips-text {
          color: white;
          font-size: 11px;
          margin: 0;
          opacity: 0.9;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}