export declare const greeting: (name?: string | null) => string;
export declare function codeLetter(input: { heading: string; intro: string; code: string; note: string }): { html: string; text: string };
export declare function noticeLetter(input: { heading: string; name?: string | null; intro: string; rows?: { label: string; value?: string; href?: string }[]; button?: { text: string; href: string }; note?: string }): { html: string; text: string };
