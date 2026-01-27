import { AppProvider } from '@/components/providers/AppProvider';
import MainApp from '@/components/MainApp';

export default function Home() {
    return (
        <AppProvider>
            <MainApp />
        </AppProvider>
    );
}
