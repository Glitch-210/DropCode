import { NextResponse } from 'next/server';
import { store } from '@/lib/server/storage';

export async function GET() {
    store.cleanup();
    return NextResponse.json({ status: 'Cleanup executed' });
}
