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
        <Tabs.Trigger value="redirects" className="btn btn-secondary data-[state=active]:bg-muted">Redirects</Tabs.Trigger>
        <Tabs.Trigger value="meta" className="btn btn-secondary data-[state=active]:bg-muted">DNS & SSL</Tabs.Trigger>
        <Tabs.Trigger value="headers" className="btn btn-secondary data-[state=active]:bg-muted">Headers</Tabs.Trigger>
        <Tabs.Trigger value="content" className="btn btn-secondary data-[state=active]:bg-muted">Content</Tabs.Trigger>
      </Tabs.List>
      <div className="p-4">
        <Tabs.Content value="overview">
          <div className="text-sm text-gray-300">Risk rationale and summary are shown above; use tabs for details.</div>
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