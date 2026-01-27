import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
    store.cleanup();
    return NextResponse.json({ status: 'Cleanup executed' });
}
