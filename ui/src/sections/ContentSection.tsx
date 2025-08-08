export default function ContentSection({ signals }: { signals: string[] }) {
  return (
    <div>
      {signals.length === 0 ? (
        <p className="text-sm text-gray-400">No suspicious signals detected.</p>
      ) : (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {signals.map((s, i) => (
            <li key={i} className="rounded-lg bg-muted px-3 py-2 text-sm">{s}</li>
          ))}
        </ul>
      )}
    </div>
  )
}