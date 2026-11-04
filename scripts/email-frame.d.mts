export declare const greeting: (name?: string | null) => string;
export declare function verificationLetter(purpose: "signup" | "recovery" | "email_change" | "staff_login", name: string, code: string): { subject: string; html: string; text: string };
export declare function codeLetter(input: { heading: string; name?: string | null; intro: string; code: string; note: string; label?: string }): { html: string; text: string };
export declare function noticeLetter(input: { heading: string; name?: string | null; intro: string; rows?: { label: string; value?: string; href?: string }[]; button?: { text: string; href: string }; note?: string; footerNote?: string; label?: string }): { html: string; text: string };

export declare function noticeSubject(topic: string, title: string): string;
