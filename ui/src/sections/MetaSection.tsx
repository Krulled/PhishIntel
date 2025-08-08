export default function MetaSection({ ssl, dns, whois }: { ssl: { issuer: string; validFrom: string; validTo: string }, dns: { a: string[]; ns: string[]; ageDays: number }, whois: { registrar: string; created: string } }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="card p-4">
        <h3 className="text-sm font-medium">SSL</h3>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <dt className="text-gray-400">Issuer</dt><dd className="col-span-2 font-mono">{ssl.issuer}</dd>
          <dt className="text-gray-400">Valid</dt><dd className="col-span-2">{ssl.validFrom} - {ssl.validTo}</dd>
        </dl>
      </div>
      <div className="card p-4">
        <h3 className="text-sm font-medium">DNS</h3>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <dt className="text-gray-400">A</dt><dd className="col-span-2 font-mono">{dns.a.join(', ')}</dd>
          <dt className="text-gray-400">NS</dt><dd className="col-span-2">{dns.ns.join(', ')}</dd>
          <dt className="text-gray-400">Age</dt><dd className="col-span-2">{dns.ageDays} days</dd>
        </dl>
      </div>
      <div className="card p-4">
        <h3 className="text-sm font-medium">Whois</h3>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <dt className="text-gray-400">Registrar</dt><dd className="col-span-2">{whois.registrar}</dd>
          <dt className="text-gray-400">Created</dt><dd className="col-span-2">{whois.created}</dd>
        </dl>
      </div>
    </div>
  )
}