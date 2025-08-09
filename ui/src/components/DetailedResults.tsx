import React, { useState } from 'react'
import type { SafeAnalysisResult } from '../services/analyzer'

interface DetailedResultsProps {
  data: SafeAnalysisResult
}

export default function DetailedResults({ data }: DetailedResultsProps) {
  const [showRaw, setShowRaw] = useState(false)

  // Create the detailed analysis object similar to the backend output
  const detailedAnalysis = {
    ai_analysis: {
      phish: data.phish_detection || 'unknown',
      reasoning: data.ai_reasoning || 'No AI analysis available',
      screenshot: data.screenshot || null,
      urlscan: {
        ssl: {
          issuer: data.ssl.issuer,
          valid_from: data.ssl.validFrom,
          valid_days: data.ssl.validTo,
          age_days: data.dns.ageDays
        },
        dns: {
          a: data.dns.a,
          ns: data.dns.ns,
          domain: new URL(data.url).hostname,
          ip: data.dns.a[0] || null,
          ptr: null
        },
        whois: data.whois.registrar !== 'Unknown' ? {
          registrar: data.whois.registrar,
          created: data.whois.created
        } : {}
      }
    },
    ai_traditional_analysis: false,
    url: data.url,
    virus_total: {
      malicious_count: 0,
      total_engines: 91
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="btn btn-secondary"
        >
          {showRaw ? 'Hide' : 'Show'} Detailed Analysis
        </button>
      </div>

      {/* Detailed Results */}
      {showRaw && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Detailed Analysis Results
          </h3>
          
          {/* Formatted Display */}
          <div className="space-y-4">
            {/* AI Analysis Section */}
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">AI Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Phishing Detection:</span>
                  <span className={`font-mono ${
                    detailedAnalysis.ai_analysis.phish === 'yes' ? 'text-red-400' :
                    detailedAnalysis.ai_analysis.phish === 'no' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    {detailedAnalysis.ai_analysis.phish}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Reasoning:</span>
                  <p className="text-sm mt-1">{detailedAnalysis.ai_analysis.reasoning}</p>
                </div>
                {detailedAnalysis.ai_analysis.screenshot && (
                  <div>
                    <span className="text-gray-400">Screenshot:</span>
                    <p className="text-xs mt-1 break-all text-blue-400">
                      {detailedAnalysis.ai_analysis.screenshot}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* URLScan Data Section */}
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">URLScan.io Data</h4>
              
              {/* SSL Information */}
              <div className="mb-4">
                <h5 className="font-medium text-yellow-400 mb-2">SSL Certificate</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Issuer:</span>
                    <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.ssl.issuer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valid From:</span>
                    <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.ssl.valid_from}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valid Days:</span>
                    <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.ssl.valid_days}</span>
                  </div>
                </div>
              </div>

              {/* DNS Information */}
              <div className="mb-4">
                <h5 className="font-medium text-purple-400 mb-2">DNS Records</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">A Records:</span>
                    <span className="font-mono">
                      {detailedAnalysis.ai_analysis.urlscan.dns.a.length > 0 
                        ? JSON.stringify(detailedAnalysis.ai_analysis.urlscan.dns.a)
                        : 'No A records'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">NS Records:</span>
                    <span className="font-mono">
                      {detailedAnalysis.ai_analysis.urlscan.dns.ns.length > 0 
                        ? JSON.stringify(detailedAnalysis.ai_analysis.urlscan.dns.ns)
                        : 'No NS records'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Domain:</span>
                    <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.dns.domain}</span>
                  </div>
                </div>
              </div>

              {/* WHOIS Information */}
              <div>
                <h5 className="font-medium text-cyan-400 mb-2">WHOIS Data</h5>
                <div className="space-y-1 text-sm">
                  {Object.keys(detailedAnalysis.ai_analysis.urlscan.whois).length > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Registrar:</span>
                        <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.whois.registrar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="font-mono">{detailedAnalysis.ai_analysis.urlscan.whois.created}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500">No WHOIS data available</span>
                  )}
                </div>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  )
}
