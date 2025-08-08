export default function HeadersSection({ headers }: { headers: { name: string; value: string; suspicious?: boolean }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr><th className="py-2">Name</th><th className="py-2">Value</th></tr>
        </thead>
        <tbody>
          {headers.map((h, i) => (
            <tr key={i} className={h.suspicious ? 'bg-red-500/10' : ''}>
              <td className="py-2 align-top font-mono">{h.name}</td>
              <td className="py-2 align-top break-all">{h.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}