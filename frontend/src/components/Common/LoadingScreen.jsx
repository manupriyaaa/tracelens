import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

const LoadingScreen = () => {
  const { t } = useLanguage()

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo">
          <div className="logo-symbol">T</div>
          <span>{t('appName')}</span>
        </div>
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>

      <style jsx>{`
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #292950 0%, #13265a 50%, #103e75 100%);
        }

        .loading-content {
          text-align: center;
          color: #fff;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .logo-symbol {
          width: 42px;
          height: 42px;
          background: #eb8d13;
          border-radius: 6px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: bold;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-left: 4px solid #eb8d13;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-content p {
          font-size: 1.1rem;
          color: #bdc3c7;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen

