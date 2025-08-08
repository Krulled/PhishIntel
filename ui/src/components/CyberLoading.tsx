import React from 'react'

interface CyberLoadingProps {
  message?: string
}

export default function CyberLoading({ message = "Analyzing URL..." }: CyberLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Animated Shield */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto relative">
            {/* Outer shield ring */}
            <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-pulse"></div>
            {/* Inner shield */}
            <div className="absolute inset-2 border-2 border-green-400 rounded-full animate-spin-slow"></div>
            {/* Center shield icon */}
            <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-wider">
            PHISHINTEL SECURITY SCAN
          </h2>
          <p className="text-blue-300 text-lg font-mono">
            {message}
          </p>
          <p className="text-gray-400 text-sm">
            This may take up to 2 minutes for comprehensive analysis
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-3">
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
          
          {/* Status Messages */}
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <span>Initializing URLScan.io connection</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Scanning SSL certificates</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Analyzing DNS records</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Processing AI analysis</span>
            </div>
          </div>
        </div>

        {/* Matrix-style background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-10">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-green-400 text-xs font-mono animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                {Math.random().toString(16).substr(2, 8)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
