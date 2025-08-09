import React from 'react'

export default function RedirectViewer({ chain, normalized }: { chain: string[]; normalized: string }) {
  const paths = chain && chain.length > 0 ? chain : [normalized]
  return (
    <details className="mb-3">
      <summary className="cursor-pointer select-none text-sm text-gray-200">Redirect path</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm text-gray-300">
        {paths.map((u, i) => <li key={i}>{u}</li>)}
      </ol>
    </details>
  )
}