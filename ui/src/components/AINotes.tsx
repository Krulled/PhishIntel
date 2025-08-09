import React from 'react'

export default function AINotes({ notes }: { notes: string[] }) {
  if (!notes || notes.length === 0) return null
  return (
    <div className="mt-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
      <div className="mb-1 text-sm font-medium">AI notes</div>
      <ul className="list-disc pl-5 text-sm text-indigo-200">
        {notes.map((m, i) => (<li key={i}>{m}</li>))}
      </ul>
    </div>
  )
}