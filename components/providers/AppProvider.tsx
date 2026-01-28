"use client";

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { FileMetadata } from '@/lib/api';

export type AppState = {
    status: 'IDLE' | 'READY' | 'UPLOADING' | 'GENERATED' | 'DOWNLOAD_ENTRY' | 'DOWNLOADING' | 'ERROR';
    data: FileMetadata | null;
    error: string | null;
    progress: number;
    mode: 'UPLOAD' | 'DOWNLOAD';
    config: {
        expiry: number | null;
        maxDownloads: number | null;
    };
    message: string | null;
};

const initialState: AppState = {
    status: 'IDLE',
    data: null,
    error: null,
    progress: 0,
    mode: 'UPLOAD',
    config: {
        expiry: null,
        maxDownloads: null,
    },
    message: null,
};

const ACTIONS = {
    SET_MODE: 'SET_MODE',
    START_UPLOAD: 'START_UPLOAD',
    SET_PROGRESS: 'SET_PROGRESS',
    UPLOAD_SUCCESS: 'UPLOAD_SUCCESS',
    UPLOAD_ERROR: 'UPLOAD_ERROR',
    ENTER_DOWNLOAD: 'ENTER_DOWNLOAD',
    FETCH_FILE_START: 'FETCH_FILE_START',
    FETCH_FILE_SUCCESS: 'FETCH_FILE_SUCCESS',
    FETCH_FILE_ERROR: 'FETCH_FILE_ERROR',
    RESET: 'RESET',
    SET_CONFIG_EXPIRY: 'SET_CONFIG_EXPIRY',
    RESET: 'RESET',
    SET_CONFIG_EXPIRY: 'SET_CONFIG_EXPIRY',
    SET_CONFIG_DOWNLOADS: 'SET_CONFIG_DOWNLOADS',
    SET_MESSAGE: 'SET_MESSAGE',
} as const;

type Action =
    | { type: 'SET_MODE'; payload: 'UPLOAD' | 'DOWNLOAD' }
    | { type: 'START_UPLOAD' }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'UPLOAD_SUCCESS'; payload: any }
    | { type: 'UPLOAD_ERROR'; payload: string }
    | { type: 'ENTER_DOWNLOAD' }
    | { type: 'FETCH_FILE_START' }
    | { type: 'FETCH_FILE_SUCCESS'; payload: any }
    | { type: 'FETCH_FILE_ERROR'; payload: string }
    | { type: 'RESET' }
    | { type: 'SET_CONFIG_EXPIRY'; payload: number }
    | { type: 'SET_CONFIG_EXPIRY'; payload: number }
    | { type: 'SET_CONFIG_DOWNLOADS'; payload: number }
    | { type: 'SET_MESSAGE'; payload: string | null };

function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_MODE':
            return {
                ...state,
                mode: action.payload,
                status: action.payload === 'UPLOAD' ? 'IDLE' : 'DOWNLOAD_ENTRY',
                error: null
            };
        case 'START_UPLOAD':
            return { ...state, status: 'UPLOADING', progress: 0, error: null };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        case 'UPLOAD_SUCCESS':
            return { ...state, status: 'GENERATED', data: action.payload, progress: 100 };
        case 'UPLOAD_ERROR':
            return { ...state, status: 'ERROR', error: action.payload, progress: 0 };
        case 'ENTER_DOWNLOAD':
            return { ...state, status: 'DOWNLOAD_ENTRY', error: null, data: null };
        case 'FETCH_FILE_START':
            return { ...state, status: 'DOWNLOADING', progress: 0, error: null };
        case 'FETCH_FILE_SUCCESS':
            return { ...state, status: 'DOWNLOADING', data: action.payload };
        case 'FETCH_FILE_ERROR':
            return { ...state, status: 'ERROR', error: action.payload };
        case 'RESET':
            // Keep the config on reset for better UX? Or clear it? 
            // Prompt says: "Reset: UI state, Config selections". So clear it.
            return { ...initialState, mode: state.mode };
        case 'SET_CONFIG_EXPIRY': {
            const newConfig = { ...state.config, expiry: action.payload };
            const isReady = newConfig.expiry !== null && newConfig.maxDownloads !== null;
            return { ...state, config: newConfig, status: isReady && state.status === 'IDLE' ? 'READY' : state.status };
        }
        case 'SET_CONFIG_DOWNLOADS': {
            const newConfig = { ...state.config, maxDownloads: action.payload };
            const isReady = newConfig.expiry !== null && newConfig.maxDownloads !== null;
            return { ...state, config: newConfig, status: isReady && state.status === 'IDLE' ? 'READY' : state.status };
        }
        case 'SET_MESSAGE':
            return { ...state, message: action.payload };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    setMode: (mode: 'UPLOAD' | 'DOWNLOAD') => void;
    startUpload: () => void;
    setProgress: (progress: number) => void;
    uploadSuccess: (data: any) => void;
    uploadError: (error: string) => void;
    enterDownload: () => void;
    fetchFileStart: () => void;
    fetchFileSuccess: (data: any) => void;
    fetchFileError: (error: string) => void;
    reset: () => void;
    setExpiry: (minutes: number) => void;
    setDownloads: (count: number) => void;
    setMessage: (message: string | null) => void;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const value = {
        state,
        setMode: (mode: 'UPLOAD' | 'DOWNLOAD') => dispatch({ type: 'SET_MODE', payload: mode }),
        startUpload: () => dispatch({ type: 'START_UPLOAD' }),
        setProgress: (progress: number) => dispatch({ type: 'SET_PROGRESS', payload: progress }),
        uploadSuccess: (data: any) => dispatch({ type: 'UPLOAD_SUCCESS', payload: data }),
        uploadError: (error: string) => dispatch({ type: 'UPLOAD_ERROR', payload: error }),
        enterDownload: () => dispatch({ type: 'ENTER_DOWNLOAD' }),
        fetchFileStart: () => dispatch({ type: 'FETCH_FILE_START' }),
        fetchFileSuccess: (data: any) => dispatch({ type: 'FETCH_FILE_SUCCESS', payload: data }),
        fetchFileError: (error: string) => dispatch({ type: 'FETCH_FILE_ERROR', payload: error }),
        reset: () => dispatch({ type: 'RESET' }),
        setExpiry: (minutes: number) => dispatch({ type: 'SET_CONFIG_EXPIRY', payload: minutes }),
        setDownloads: (count: number) => dispatch({ type: 'SET_CONFIG_DOWNLOADS', payload: count }),
        setMessage: (message: string | null) => dispatch({ type: 'SET_MESSAGE', payload: message }),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
