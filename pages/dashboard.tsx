import React, { useState, useEffect } from "react";
import { Layout } from "components/layout/Layout";
import { useAppSlice } from "hooks/selector";
import classNames from "classnames";

const Dashboard = () => {
  const { darkMode } = useAppSlice();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className="w-full h-full min-h-screen bg-color-bgPage">
      <div className="w-full h-full relative">
        {/* Loading overlay */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-color-bgPage z-10">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-highlight"></div>
              <p className="text-color-text1 text-lg">
                Loading Vouch Dashboard...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-color-bgPage z-10">
            <div className="flex flex-col items-center space-y-4 text-center p-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-color-text1 mb-2">
                Unable to Load Dashboard
              </h2>
              <p className="text-color-text2 mb-4 max-w-md">
                There was an issue loading the Vouch dashboard. Please check
                your internet connection and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-color-highlight text-white rounded-lg hover:opacity-80 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Iframe container */}
        <div className="w-full h-full">
          <iframe
            src="https://dash.vouch.run/"
            className={classNames(
              "w-full h-screen border-0 transition-opacity duration-300",
              iframeLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Vouch Dashboard"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
