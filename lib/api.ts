const API_BASE = '/api';

export type FileMetadata = {
    code: string;
    originalName: string;
    size: number;
    mimeType: string;
    expiresAt: number;
    fileCount: number;
    expiryMinutes: number;
    maxDownloads: string | number;
    downloads: number;
};

export const uploadFile = async (files: File[] | FileList, onProgress?: (percent: number) => void): Promise<any> => {
    const formData = new FormData();
    const fileList = files instanceof FileList ? Array.from(files) : files;

    fileList.forEach(file => {
        formData.append('files', file);
    });

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded * 100) / event.total);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject({ error: 'Invalid response' });
                }
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    reject(response);
                } catch (e) {
                    reject({ error: 'Upload failed' });
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject({ error: 'Network Error' });
        });

        xhr.addEventListener('abort', () => {
            reject({ error: 'Upload Cancelled' });
        });

        xhr.open('POST', `${API_BASE}/upload`);
        xhr.send(formData);
    });
};

export const getFileMetadata = async (code: string): Promise<FileMetadata> => {
    const res = await fetch(`${API_BASE}/verify?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

export const updateFileMetadata = async (code: string, updates: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ...updates })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

export const getDownloadUrl = (code: string): string => {
    return `${API_BASE}/download?code=${encodeURIComponent(code)}`;
};
