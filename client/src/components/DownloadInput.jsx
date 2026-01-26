import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getFileMetadata } from '../services/api';

export default function DownloadInput() {
    const { fetchFileStart, fetchFileSuccess, fetchFileError } = useApp();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code || code.length < 5) return;

        setIsLoading(true);
        // Move to "Downloading" state immediately for UX, but technically we are "Fetching Metadata" first
        // In our simplified state machine, we can dispatch START, then SUCCESS with metadata
        fetchFileStart();

        try {
            const data = await getFileMetadata(code);
            // Wait a tiny bit for effect
            setTimeout(() => {
                fetchFileSuccess(data);
            }, 500);
        } catch (err) {
            console.error(err);
            // Edge Case 10: Invalid Code Format
            let msg = err.error || 'File not found';
            if (msg.includes('not found')) {
                msg = 'INVALID CODE';
            }
            fetchFileError(msg);
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center" style={{ width: '100%', padding: 'var(--space-lg) 0' }}>
            <p className="font-bold uppercase" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                ENTER CODE
            </p>

            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    className="brutal-input"
                    placeholder="XXXXX"
                    maxLength={10}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={isLoading}
                    aria-label="Enter download code"
                />

                <button
                    type="submit"
                    className="brutal-button"
                    style={{ width: '100%', marginTop: 'var(--space-lg)' }}
                    disabled={isLoading || code.length < 5}
                >
                    {isLoading ? 'SEARCHING...' : 'GET FILE'}
                </button>
            </form>
        </div>
    );
}
