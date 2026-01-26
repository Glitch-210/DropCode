import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Upload a file to the backend.
 * @param {File} file - The file object to upload
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<Object>} - The response data (code, expiresAt, etc.)
 */
export const uploadFile = async (files, onProgress) => {
    const formData = new FormData();
    // Support both single file and array/FileList
    const fileList = files.length !== undefined ? files : [files];

    for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
    }

    // Stall timeout (15 seconds without progress)
    const STALL_TIMEOUT = 15000;
    const controller = new AbortController();
    let timeoutId;

    const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            controller.abort('Upload Stalled');
        }, STALL_TIMEOUT);
    };

    resetTimeout();

    try {
        const response = await axios.post(`${API_BASE}/upload`, formData, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                resetTimeout(); // Reset timer on active progress
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            },
        });
        if (timeoutId) clearTimeout(timeoutId);
        return response.data;
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Handle Abort
        if (axios.isCancel(error) || error.message === 'Upload Stalled' || error.name === 'CanceledError') {
            throw { error: 'UPLOAD INTERRUPTED (STALLED)' };
        }

        // Propagate other errors
        throw error.response ? error.response.data : new Error(error.message || 'Network Error');
    }
};

/**
 * Fetch file metadata by code.
 * @param {string} code 
 * @returns {Promise<Object>}
 */
export const getFileMetadata = async (code) => {
    try {
        const response = await axios.get(`${API_BASE}/file/${code}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Network Error');
    }
};

/**
 * Update file metadata (expiry, limits)
 * @param {string} code 
 * @param {Object} updates { expiryMinutes, maxDownloads }
 * @returns {Promise<Object>}
 */
export const updateFileMetadata = async (code, updates) => {
    try {
        const response = await axios.patch(`${API_BASE}/file/${code}`, updates);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Network Error');
    }
};

/**
 * Get the direct download URL for a file code.
 * @param {string} code 
 * @returns {string}
 */
export const getDownloadUrl = (code) => {
    return `${API_BASE}/download/${code}`;
};
