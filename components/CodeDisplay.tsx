"use client";
import { useState, useEffect } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { updateFileMetadata } from '@/lib/api';

export default function CodeDisplay() {
    const { state, reset, uploadSuccess } = useApp();
    const { code, expiresAt, expiryMinutes, maxDownloads } = state.data || {};
    const [timeLeft, setTimeLeft] = useState('');
    const [copied, setCopied] = useState(false);

    // Local state for UI toggles
    const [selectedExpiry, setSelectedExpiry] = useState(expiryMinutes || 10);
    const [selectedLimit, setSelectedLimit] = useState(maxDownloads === 'Unlimited' ? 'Unlimited' : maxDownloads || 'Unlimited');

    useEffect(() => {
        if (!expiresAt) return;
        const updateTimer = () => {
            const now = Date.now();
            const diff = expiresAt - now;
            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                return;
            }
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const copyCode = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpdate = async (updates: any) => {
        if (!code) return;
        try {
            const updatedData = await updateFileMetadata(code, updates);
            uploadSuccess({ ...state.data, ...updatedData });

            if (updates.expiryMinutes) setSelectedExpiry(updates.expiryMinutes);
            if (updates.maxDownloads !== undefined) setSelectedLimit(updates.maxDownloads === Infinity ? 'Unlimited' : updates.maxDownloads);

        } catch (err) {
            console.error('Failed to update metadata', err);
            alert('Failed to update settings');
        }
    };

    return (
        <div className="text-center" style={{ width: '100%', padding: 'var(--space-lg) 0' }}>
            <p className="font-bold uppercase" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                YOUR CODE
            </p>

            <div className="brutal-code">
                {code}
            </div>

            <div style={{ marginTop: 'var(--space-lg)' }}>
                <button className="brutal-button" onClick={copyCode} style={{ minWidth: '200px' }}>
                    {copied ? 'COPIED!' : 'COPY CODE'}
                </button>
            </div>

            {/* Success Stats */}
            <div className="brutal-container" style={{ marginTop: 'var(--space-xl)', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <span className="font-bold">EXPIRES IN:</span>
                    <span className="text-mono" style={{ color: 'var(--color-accent-red)' }}>{timeLeft}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-bold">DOWNLOADS LEFT:</span>
                    <span className="text-mono">{maxDownloads === Infinity ? '∞' : (state.data?.downloadsLeft ?? maxDownloads)}</span>
                </div>
            </div>



            <p
                style={{ marginTop: 'var(--space-lg)', textDecoration: 'underline', cursor: 'pointer', opacity: 0.7 }}
                onClick={reset}
            >
                SEND ANOTHER FILE
            </p>
        </div>
    );
}
