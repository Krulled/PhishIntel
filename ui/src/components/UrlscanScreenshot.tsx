import React, { useState, useEffect } from 'react';
import { getUrlscanSummary } from '../services/apiClient';

interface UrlscanScreenshotProps {
  uuid?: string;
  url?: string;
}

export const UrlscanScreenshot: React.FC<UrlscanScreenshotProps> = ({ uuid, url }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    if (uuid && imageLoaded) {
      getUrlscanSummary(uuid).then(setSummary);
    }
  }, [uuid, imageLoaded]);
  
  if (!uuid) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No screenshot available</p>
        {url && (
          <a 
            href={`https://urlscan.io/search/#${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            View on URLScan.io
          </a>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <img
        src={`/api/urlscan/${uuid}/screenshot`}
        alt="Website screenshot"
        className="w-full rounded border"
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {summary && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Screenshot Summary:</span> {summary}
        </p>
      )}
    </div>
  );
};

export default UrlscanScreenshot;