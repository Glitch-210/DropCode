import { createContext, useContext, useReducer } from 'react';

// Initial State
const initialState = {
    status: 'IDLE', // IDLE, UPLOADING, GENERATED, DOWNLOAD_ENTRY, DOWNLOADING, ERROR
    data: null,     // Holds file metadata, code, etc.
    error: null,    // Error message
    progress: 0,    // Upload/Download progress
    mode: 'UPLOAD', // UPLOAD or DOWNLOAD (initial entry point)
};

// Actions
const ACTIONS = {
    SET_MODE: 'SET_MODE',
    START_UPLOAD: 'START_UPLOAD',
    SET_PROGRESS: 'SET_PROGRESS',
    UPLOAD_SUCCESS: 'UPLOAD_SUCCESS',
    UPLOAD_ERROR: 'UPLOAD_ERROR',
    ENTER_DOWNLOAD: 'ENTER_DOWNLOAD', // User manually switches to download entry
    FETCH_FILE_START: 'FETCH_FILE_START',
    FETCH_FILE_SUCCESS: 'FETCH_FILE_SUCCESS',
    FETCH_FILE_ERROR: 'FETCH_FILE_ERROR',
    RESET: 'RESET',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_MODE:
            return { ...state, mode: action.payload, status: action.payload === 'UPLOAD' ? 'IDLE' : 'DOWNLOAD_ENTRY', error: null };

        case ACTIONS.START_UPLOAD:
            return { ...state, status: 'UPLOADING', progress: 0, error: null };

        case ACTIONS.SET_PROGRESS:
            return { ...state, progress: action.payload };

        case ACTIONS.UPLOAD_SUCCESS:
            return { ...state, status: 'GENERATED', data: action.payload, progress: 100 };

        case ACTIONS.UPLOAD_ERROR:
            return { ...state, status: 'ERROR', error: action.payload, progress: 0 };

        case ACTIONS.ENTER_DOWNLOAD:
            return { ...state, status: 'DOWNLOAD_ENTRY', error: null, data: null };

        case ACTIONS.FETCH_FILE_START:
            return { ...state, status: 'DOWNLOADING', progress: 0, error: null }; // We skip metadata preview for speed in MVP, or add it later

        case ACTIONS.FETCH_FILE_SUCCESS:
            return { ...state, status: 'DOWNLOADING', data: action.payload }; // Actually we might just download immediately

        case ACTIONS.FETCH_FILE_ERROR:
            return { ...state, status: 'ERROR', error: action.payload };

        case ACTIONS.RESET:
            return { ...initialState, mode: state.mode }; // Keep current mode

        default:
            return state;
    }
}

// Context
const AppContext = createContext();

// Provider
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const value = {
        state,
        setMode: (mode) => dispatch({ type: ACTIONS.SET_MODE, payload: mode }),
        startUpload: () => dispatch({ type: ACTIONS.START_UPLOAD }),
        setProgress: (progress) => dispatch({ type: ACTIONS.SET_PROGRESS, payload: progress }),
        uploadSuccess: (data) => dispatch({ type: ACTIONS.UPLOAD_SUCCESS, payload: data }),
        uploadError: (error) => dispatch({ type: ACTIONS.UPLOAD_ERROR, payload: error }),
        enterDownload: () => dispatch({ type: ACTIONS.ENTER_DOWNLOAD }),
        fetchFileStart: () => dispatch({ type: ACTIONS.FETCH_FILE_START }),
        fetchFileSuccess: (data) => dispatch({ type: ACTIONS.FETCH_FILE_SUCCESS, payload: data }),
        fetchFileError: (error) => dispatch({ type: ACTIONS.FETCH_FILE_ERROR, payload: error }),
        reset: () => dispatch({ type: ACTIONS.RESET }),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
