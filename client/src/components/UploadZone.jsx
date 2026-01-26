import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { uploadFile } from '../services/api';

export default function UploadZone() {
    const { startUpload, setProgress, uploadSuccess, uploadError } = useApp();
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        // Check MVP file size limit (200MB)
        if (file.size > 200 * 1024 * 1024) {
            alert('File too large (Max 200MB)'); // Simple alert for MVP
            return;
        }

        startUpload();
        try {
            const data = await uploadFile(file, (percent) => {
                setProgress(percent);
            });
            // Small delay to ensure users see 100% completion
            setTimeout(() => {
                uploadSuccess(data);
            }, 300);
        } catch (err) {
            console.error(err);
            uploadError(err.error || 'Upload failed');
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onDragOver = (e) => {
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
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={(e) => handleFile(e.target.files[0])}
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
