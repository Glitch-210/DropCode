import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function CodeDisplay() {
    const { state, reset } = useApp();
    const { code, expiresAt } = state.data || {};
    const [timeLeft, setTimeLeft] = useState('');
    const [copied, setCopied] = useState(false);

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
    }, [expiresAt]);

    const copyCode = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
