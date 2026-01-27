"use client";
import { useRef, useState, DragEvent } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { uploadFile } from '@/lib/api';

export default function UploadZone() {
    const { startUpload, setProgress, uploadSuccess, uploadError } = useApp();
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (files: FileList | File[] | null) => {
        if (!files || files.length === 0) return;

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
            const data = await uploadFile(fileList as File[], (percent) => {
                setProgress(percent);
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
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                multiple
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={(e) => handleFile(e.target.files)}
                aria-label="Upload File"
            />
            <p className="font-bold uppercase" style={{ fontSize: '1.5rem', pointerEvents: 'none' }}>
                {isDragOver ? "Drop It!" : "Drop File Here"}
            </p>
            <p style={{ marginTop: 'var(--space-md)', color: '#666', pointerEvents: 'none' }}>
                CLICK IF YOU MUST
            </p>
        </div>
    );
}
