import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDownloadUrl } from '../services/api';

export default function DownloadingState() {
    const { state, reset } = useApp();
    const { code, originalName, size } = state.data || {};

    useEffect(() => {
        if (code) {
            // Trigger download
            const url = getDownloadUrl(code);
            // Small delay to let user see the screen
            const timer = setTimeout(() => {
                window.location.href = url;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [code]);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="text-center" style={{ width: '100%', padding: 'var(--space-lg) 0' }}>
            <p className="font-bold uppercase" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                DOWNLOADING...
            </p>

            <div className="brutal-container" style={{ backgroundColor: 'var(--color-bg-mint)' }}>
                <p className="font-bold" style={{ fontSize: '1.5rem', wordBreak: 'break-all' }}>
                    {originalName}
                </p>
                <p className="text-mono" style={{ marginTop: 'var(--space-sm)' }}>
                    {formatSize(size)}
                </p>
            </div>

            <div className="brutal-progress" style={{ marginTop: 'var(--space-lg)' }}>
                <div
                    className="brutal-progress-fill"
                    style={{ width: '100%', animation: 'pulse 2s infinite' }}
                ></div>
            </div>

            <button
                className="brutal-button"
                onClick={reset}
                style={{ marginTop: 'var(--space-xl)', width: '100%' }}
            >
                SEND A FILE
            </button>
        </div>
    );
}
