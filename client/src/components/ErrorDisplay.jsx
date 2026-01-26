import { useApp } from '../context/AppContext';

export default function ErrorDisplay() {
    const { state, reset } = useApp();
    const { error } = state;

    return (
        <div className="text-center" style={{ width: '100%', padding: 'var(--space-lg) 0' }}>
            <div className="brutal-error brutal-container" style={{ marginBottom: 'var(--space-lg)' }}>
                <p className="font-bold uppercase" style={{ fontSize: '1.5rem', color: 'var(--color-accent-red)' }}>
                    ERROR
                </p>
                <p style={{ marginTop: 'var(--space-md)', fontSize: '1.2rem' }}>
                    {error || 'SOMETHING WENT WRONG'}
                </p>
            </div>

            <button
                className="brutal-button"
                onClick={reset}
                style={{ width: '100%' }}
            >
                TRY AGAIN
            </button>
        </div>
    );
}
