import './App.css'
import { AppProvider, useApp } from './context/AppContext'

import UploadZone from './components/UploadZone';
import UploadingState from './components/UploadingState';
import CodeDisplay from './components/CodeDisplay';
import DownloadInput from './components/DownloadInput';
import DownloadingState from './components/DownloadingState';
import ErrorDisplay from './components/ErrorDisplay';

// Placeholder components (we'll implement the rest next)
// const DownloadingState = () => <div className="brutal-container">Downloading... (TODO)</div>;
// const ErrorDisplay = () => <div className="brutal-container">Error (TODO)</div>;

function Main() {
  const { state, setMode, reset } = useApp();

  return (
    <div className="full-screen">
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <button
          className="brutal-button"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          onClick={() => setMode(state.mode === 'UPLOAD' ? 'DOWNLOAD' : 'UPLOAD')}
        >
          {state.mode === 'UPLOAD' ? 'SWITCH TO DOWNLOAD' : 'SWITCH TO UPLOAD'}
        </button>
      </div>

      <div className="brutal-container" style={{ maxWidth: '600px', width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1
          className="text-center"
          style={{ marginBottom: 'var(--space-xl)', cursor: 'pointer' }}
          onClick={reset}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && reset()}
        >
          DropCode
        </h1>

        {state.status === 'IDLE' && <UploadZone />}
        {state.status === 'UPLOADING' && <UploadingState />}
        {state.status === 'GENERATED' && <CodeDisplay />}

        {state.status === 'DOWNLOAD_ENTRY' && <DownloadInput />}
        {state.status === 'DOWNLOADING' && <DownloadingState />}

        {state.status === 'ERROR' && <ErrorDisplay />}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  )
}

export default App
