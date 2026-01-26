import { useApp } from '../context/AppContext';

export default function UploadingState() {
    const { state } = useApp();

    return (
        <div className="text-center" style={{ width: '100%', padding: 'var(--space-lg) 0' }}>
            <p className="font-bold uppercase" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                UPLOADING...
            </p>

            <div className="brutal-progress">
                <div
                    className="brutal-progress-fill"
                    style={{ width: `${state.progress}%` }}
                ></div>
            </div>

            <p className="font-bold" style={{ fontSize: '3rem', marginTop: 'var(--space-md)', lineHeight: '1' }}>
                {state.progress}%
            </p>
        </div>
    );
}
