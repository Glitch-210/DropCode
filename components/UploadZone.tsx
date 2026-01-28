"use client";
import { useRef, useState, DragEvent } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { uploadFile } from '@/lib/api';

export default function UploadZone() {
    const { state, startUpload, setProgress, uploadSuccess, uploadError, setMessage } = useApp();
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isReady = state.status === 'READY';

    const handleFile = async (files: FileList | File[] | null) => {
        if (!files || files.length === 0) return;

        // Guardrail: Must be READY
        if (!isReady) {
            alert('Please select Expiry and Download Limit first.');
            return;
        }

        // Calculate total size
        let totalSize = 0;
        const fileList = files instanceof FileList ? Array.from(files) : files;

        // This is safe because we just converted it to an array
        for (const file of fileList as File[]) {
            totalSize += file.size;
        }

        // Check MVP file size limit (200MB total)
        if (totalSize > 200 * 1024 * 1024) {
            alert('Total size too large (Max 200MB)');
            return;
        }

        startUpload();
        try {
            // Pass the config from state
            const settings = {
                expiryMinutes: state.config.expiry!,
                maxDownloads: state.config.maxDownloads!
            };

            const data = await uploadFile(fileList as File[], settings, (percent) => {
                setProgress(percent);
            }, (status) => {
                setMessage(status);
            });
            // Small delay to ensure users see 100% completion
            setTimeout(() => {
                uploadSuccess(data);
            }, 300);
        } catch (err: any) {
            console.error(err);
            uploadError(err.error || 'Upload failed');
        }
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files);
        }
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = () => {
        setIsDragOver(false);
    };

    return (
        <div
            className={`brutal-upload-zone ${isDragOver ? 'dragover' : ''}`}
            style={{
                opacity: isReady ? 1 : 0.5,
                cursor: isReady ? 'pointer' : 'not-allowed',
                position: 'relative'
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => isReady && fileInputRef.current?.click()}
        >
            <input
                type="file"
                multiple
                accept="*/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={(e) => handleFile(e.target.files)}
                aria-label="Upload File"
                disabled={!isReady}
            />

            {!isReady ? (
                <div className="text-center">
                    <p className="font-bold uppercase" style={{ fontSize: '1.2rem', color: 'black' }}>
                        CONFIGURATION REQUIRED
                    </p>
                    <p className="text-mono" style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
                        SELECT EXPIRY & LIMIT ABOVE
                    </p>
                </div>
            ) : (
                <>
                    <p className="font-bold uppercase" style={{ fontSize: '1.5rem', pointerEvents: 'none' }}>
                        {isDragOver ? "Drop It!" : "Drop File Here"}
                    </p>
                    <p style={{ marginTop: 'var(--space-md)', color: 'black', pointerEvents: 'none', fontWeight: 'bold' }}>
                        CLICK IF YOU MUST
                    </p>
                    <div className="text-mono" style={{ marginTop: 'var(--space-lg)', fontSize: '0.8rem', color: 'black', pointerEvents: 'none' }}>
                        <p>MAX 200MB • ENCRYPTED</p>
                        <p>NO ACCOUNTS • NO LOGS</p>
                    </div>
                </>
            )}
        </div>
    );
}
