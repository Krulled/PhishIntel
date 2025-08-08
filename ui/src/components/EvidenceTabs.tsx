import * as Tabs from '@radix-ui/react-tabs'
import { lazy, Suspense } from 'react'
import type { SafeAnalysisResult } from '../services/analyzer'

const RedirectsSection = lazy(() => import('../sections/RedirectsSection'))
const MetaSection = lazy(() => import('../sections/MetaSection'))
const HeadersSection = lazy(() => import('../sections/HeadersSection'))
const ContentSection = lazy(() => import('../sections/ContentSection'))

export default function EvidenceTabs({ data }: { data: SafeAnalysisResult }) {
  return (
    <Tabs.Root defaultValue="overview" orientation="horizontal" className="card p-0 overflow-hidden">
      <Tabs.List aria-label="Evidence" className="flex gap-1 border-b border-border p-2">
        <Tabs.Trigger value="overview" className="btn btn-secondary data-[state=active]:bg-muted">Overview</Tabs.Trigger>
        <Tabs.Trigger value="ai" className="btn btn-secondary data-[state=active]:bg-muted">AI Analysis</Tabs.Trigger>
        <Tabs.Trigger value="redirects" className="btn btn-secondary data-[state=active]:bg-muted">Redirects</Tabs.Trigger>
        <Tabs.Trigger value="meta" className="btn btn-secondary data-[state=active]:bg-muted">DNS & SSL</Tabs.Trigger>
        <Tabs.Trigger value="headers" className="btn btn-secondary data-[state=active]:bg-muted">Headers</Tabs.Trigger>
        <Tabs.Trigger value="content" className="btn btn-secondary data-[state=active]:bg-muted">Content</Tabs.Trigger>
      </Tabs.List>
      <div className="p-4">
        <Tabs.Content value="overview">
          <div className="text-sm text-gray-300">Risk rationale and summary are shown above; use tabs for details.</div>
        </Tabs.Content>
        <Tabs.Content value="ai">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy>Loading AI analysis…</div>}>
            <AIAnalysisSection data={data} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="redirects">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy>Loading redirects…</div>}>
            <RedirectsSection redirects={data.redirects} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="meta">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy>Loading meta…</div>}>
            <MetaSection ssl={data.ssl} dns={data.dns} whois={data.whois} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="headers">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy>Loading headers…</div>}>
            <HeadersSection headers={data.headers} />
          </Suspense>
        </Tabs.Content>
        <Tabs.Content value="content">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy>Loading content…</div>}>
            <ContentSection signals={data.contentSignals} />
          </Suspense>
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}

function AIAnalysisSection({ data }: { data: SafeAnalysisResult }) {
  return (
    <div className="space-y-4">
      {/* AI Detection Result */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-3">AI Phishing Detection</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Detection:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              data.phish_detection === 'yes' 
                ? 'bg-red-500/20 text-red-300' 
                : data.phish_detection === 'no'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {data.phish_detection === 'yes' ? 'Phishing Detected' : 
               data.phish_detection === 'no' ? 'Safe' : 'Unknown'}
            </span>
          </div>
          {data.ai_reasoning && (
            <div>
              <span className="text-sm text-gray-400">Reasoning:</span>
              <p className="text-sm mt-1">{data.ai_reasoning}</p>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot */}
      {data.screenshot && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-3">URL Screenshot</h3>
          <div className="relative">
            <img 
              src={data.screenshot} 
              alt="URL screenshot" 
              className="w-full rounded border border-border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden text-sm text-gray-400 text-center py-4">
              Screenshot unavailable
            </div>
          </div>
        </div>
      )}

      {/* AI Findings */}
      {data.findings && data.findings.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-3">AI Findings</h3>
          <div className="space-y-2">
            {data.findings.map((finding) => (
              <div key={finding.id} className="flex items-start gap-2">
                <span className={`w-2 h-2 rounded-full mt-2 ${
                  finding.severity === 'high' ? 'bg-red-500' :
                  finding.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{finding.title}</div>
                  {finding.description && (
                    <div className="text-xs text-gray-400 mt-1">{finding.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}