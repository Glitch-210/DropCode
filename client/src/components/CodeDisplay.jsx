import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { updateFileMetadata } from '../services/api';

export default function CodeDisplay() {
    const { state, reset, uploadSuccess } = useApp();
    const { code, expiresAt, expiryMinutes, maxDownloads } = state.data || {};
    const [timeLeft, setTimeLeft] = useState('');
    const [copied, setCopied] = useState(false);

    // Local state for UI toggles
    const [selectedExpiry, setSelectedExpiry] = useState(expiryMinutes || 10);
    const [selectedLimit, setSelectedLimit] = useState(maxDownloads === 'Unlimited' ? 'Unlimited' : maxDownloads || 'Unlimited');

    useEffect(() => {
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
    }, [expiresAt]); // Re-run when expiresAt changes

    const copyCode = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpdate = async (updates) => {
        try {
            const updatedData = await updateFileMetadata(code, updates);
            // Update app state with new metadata
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

            {/* Config Controls */}
            <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', alignItems: 'center' }}>

                {/* Expiry Control */}
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>EXPIRES IN</p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {[5, 10, 30].map(mins => (
                            <button
                                key={mins}
                                onClick={() => handleUpdate({ expiryMinutes: mins })}
                                style={{
                                    padding: 'var(--space-xs) var(--space-md)',
                                    border: '2px solid black',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedExpiry === mins ? 'var(--color-bg-accent)' : 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                {mins}M
                            </button>
                        ))}
                    </div>
                </div>

                {/* Download Limit Control */}
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>MAX DOWNLOADS</p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {[1, 3, 'Unlimited'].map(limit => (
                            <button
                                key={limit}
                                onClick={() => handleUpdate({ maxDownloads: limit === 'Unlimited' ? 'Infinity' : limit })}
                                style={{
                                    padding: 'var(--space-xs) var(--space-md)',
                                    border: '2px solid black',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedLimit === limit ? 'var(--color-bg-accent)' : 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                {limit === 'Unlimited' ? '∞' : limit}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <p className="font-bold" style={{ marginTop: 'var(--space-xl)', fontSize: '1.2rem' }}>
                EXPIRES IN: <span style={{ color: 'var(--color-accent-red)' }}>{timeLeft}</span>
            </p>

            <p
                style={{ marginTop: 'var(--space-lg)', textDecoration: 'underline', cursor: 'pointer', opacity: 0.7 }}
                onClick={reset}
            >
                SEND ANOTHER FILE
            </p>
        </div>
    );
}
