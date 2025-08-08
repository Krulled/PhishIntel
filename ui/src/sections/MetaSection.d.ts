export default function MetaSection({ ssl, dns, whois }: {
    ssl: {
        issuer: string;
        validFrom: string;
        validTo: string;
    };
    dns: {
        a: string[];
        ns: string[];
        ageDays: number;
    };
    whois: {
        registrar: string;
        created: string;
    };
}): import("react/jsx-runtime").JSX.Element;
