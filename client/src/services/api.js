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
