"use client";
import { useApp } from '@/components/providers/AppProvider';

export default function ConfigSelector() {
    const { state, setExpiry, setDownloads } = useApp();
    const { config, status } = state;
    const isLocked = status === 'UPLOADING';

    return (
        <div style={{ marginBottom: 'var(--space-xl)', width: '100%' }}>
            {/* Expiry Section */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <p className="font-bold uppercase" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-sm)' }}>
                    Expires In (Required)
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {[5, 10, 30].map((min) => (
                        <button
                            key={min}
                            onClick={() => !isLocked && setExpiry(min)}
                            disabled={isLocked}
                            className="text-mono"
                            style={{
                                flex: 1,
                                padding: 'var(--space-sm)',
                                border: 'var(--border-thick) solid var(--color-border)',
                                backgroundColor: config.expiry === min ? 'var(--color-bg-primary)' : 'var(--color-bg-card)',
                                color: config.expiry === min ? 'var(--color-text-primary)' : '#999',
                                fontWeight: config.expiry === min ? 800 : 400,
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.1s ease',
                                boxShadow: config.expiry === min ? '4px 4px 0 var(--color-border)' : 'none',
                                transform: config.expiry === min ? 'translate(-2px, -2px)' : 'none',
                                opacity: isLocked ? 0.7 : 1
                            }}
                        >
                            {min}m
                        </button>
                    ))}
                </div>
            </div>

            {/* Downloads Section */}
            <div>
                <p className="font-bold uppercase" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-sm)' }}>
                    Download Limit (Required)
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {[1, 3, 100].map((limit) => (
                        <button
                            key={limit}
                            onClick={() => !isLocked && setDownloads(limit)}
                            disabled={isLocked}
                            className="text-mono"
                            style={{
                                flex: 1,
                                padding: 'var(--space-sm)',
                                border: 'var(--border-thick) solid var(--color-border)',
                                backgroundColor: config.maxDownloads === limit ? 'var(--color-bg-primary)' : 'var(--color-bg-card)',
                                color: config.maxDownloads === limit ? 'var(--color-text-primary)' : '#999',
                                fontWeight: config.maxDownloads === limit ? 800 : 400,
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.1s ease',
                                boxShadow: config.maxDownloads === limit ? '4px 4px 0 var(--color-border)' : 'none',
                                transform: config.maxDownloads === limit ? 'translate(-2px, -2px)' : 'none',
                                opacity: isLocked ? 0.7 : 1
                            }}
                        >
                            {limit === 100 ? '∞' : limit}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
