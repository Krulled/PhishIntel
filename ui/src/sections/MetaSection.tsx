export default function MetaSection({ ssl, dns, whois }: { ssl: { issuer: string; validFrom: string; validTo: string }, dns: { a: string[]; ns: string[]; ageDays: number }, whois: { registrar: string; created: string } }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Unknown') return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getRiskLevel = (ssl: any, dns: any, whois: any) => {
    let riskFactors = [];
    
    // SSL risk factors
    if (ssl.issuer === 'Unknown' || ssl.issuer?.toLowerCase().includes('unknown')) {
      riskFactors.push('SSL Certificate Issues');
    }
    
    // DNS risk factors
    if (dns.ageDays < 30) {
      riskFactors.push('Recently Registered Domain');
    }
    
    // WHOIS risk factors
    if (whois.registrar === 'Unknown' || whois.registrar?.toLowerCase().includes('unknown')) {
      riskFactors.push('Suspicious Registrar');
    }
    
    return riskFactors;
  };

  const riskFactors = getRiskLevel(ssl, dns, whois);

  return (
    <div className="space-y-4">
      {/* Risk Assessment */}
      {riskFactors.length > 0 && (
        <div className="card p-4 border-l-4 border-amber-500 bg-amber-500/10">
          <h3 className="text-sm font-medium text-amber-300 mb-2">⚠️ Risk Factors Detected</h3>
          <ul className="text-sm text-amber-200 space-y-1">
            {riskFactors.map((factor, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            SSL Certificate
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-400 text-xs">Issuer</dt>
              <dd className="font-mono text-xs break-all">
                {ssl.issuer === 'Unknown' ? (
                  <span className="text-red-400">Unknown/Invalid</span>
                ) : (
                  ssl.issuer
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Valid From</dt>
              <dd className="text-xs">{formatDate(ssl.validFrom)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Valid To</dt>
              <dd className="text-xs">{formatDate(ssl.validTo)}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            DNS Information
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-400 text-xs">IP Addresses (A)</dt>
              <dd className="font-mono text-xs">
                {dns.a.length > 0 ? (
                  dns.a.map((ip, index) => (
                    <div key={index} className="break-all">{ip}</div>
                  ))
                ) : (
                  <span className="text-gray-500">No A records</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Nameservers (NS)</dt>
              <dd className="font-mono text-xs">
                {dns.ns.length > 0 ? (
                  dns.ns.map((ns, index) => (
                    <div key={index} className="break-all">{ns}</div>
                  ))
                ) : (
                  <span className="text-gray-500">No NS records</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Domain Age</dt>
              <dd className="text-xs">
                {dns.ageDays > 0 ? (
                  <span className={dns.ageDays < 30 ? 'text-amber-400' : 'text-green-400'}>
                    {dns.ageDays} days
                    {dns.ageDays < 30 && <span className="ml-1 text-xs">⚠️ New</span>}
                  </span>
                ) : (
                  <span className="text-gray-500">Unknown</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            WHOIS Information
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-400 text-xs">Registrar</dt>
              <dd className="text-xs break-all">
                {whois.registrar === 'Unknown' ? (
                  <span className="text-red-400">Unknown/Invalid</span>
                ) : (
                  whois.registrar
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Registration Date</dt>
              <dd className="text-xs">{formatDate(whois.created)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs">Status</dt>
              <dd className="text-xs">
                {whois.registrar === 'Unknown' ? (
                  <span className="text-red-400">Suspicious</span>
                ) : (
                  <span className="text-green-400">Valid</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card p-4 bg-gray-800/50">
        <h3 className="text-sm font-medium mb-2">🔍 Analysis Notes</h3>
        <div className="text-xs text-gray-300 space-y-1">
          <p>• SSL certificates from unknown issuers may indicate security risks</p>
          <p>• Domains registered less than 30 days ago are considered suspicious</p>
          <p>• Unknown or invalid registrar information suggests potential fraud</p>
          <p>• Multiple IP addresses may indicate load balancing or CDN usage</p>
        </div>
      </div>
    </div>
  )
}