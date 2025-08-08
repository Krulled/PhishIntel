export default function RedirectsSection({ redirects }: {
    redirects: {
        index: number;
        domain: string;
        status: number;
        risk: 'low' | 'medium' | 'high';
    }[];
}): import("react/jsx-runtime").JSX.Element;
