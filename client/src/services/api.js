import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

/**
 * Upload a file to the backend.
 * @param {File} file - The file object to upload
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<Object>} - The response data (code, expiresAt, etc.)
 */
export const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_BASE}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Network Error');
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
 * Get the direct download URL for a file code.
 * @param {string} code 
 * @returns {string}
 */
export const getDownloadUrl = (code) => {
    return `${API_BASE}/download/${code}`;
};
