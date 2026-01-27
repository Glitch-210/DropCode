import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DropCode',
    description: 'Fast, secure file sharing.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
