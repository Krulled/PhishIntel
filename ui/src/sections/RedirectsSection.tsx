export default function RedirectsSection({ redirects }: { redirects: { index: number; domain: string; status: number; risk: 'low' | 'medium' | 'high' }[] }) {
  return (
    <ol className="relative ms-4 border-s border-border">
      {redirects.map((r) => (
        <li key={r.index} className="mb-4 ms-4">
          <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-accent-green" />
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm">{r.domain}</div>
            <div className="text-xs text-gray-400">HTTP {r.status}</div>
          </div>
          <div className="text-xs text-gray-300">Estimated risk: {r.risk}</div>
        </li>
      ))}
    </ol>
  )
}