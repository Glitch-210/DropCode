import "server-only";
import { NextResponse } from 'next/server';
import { redis } from '@/lib/server/redis';

export async function GET() {
    try {
        // Test Redis
        await redis.ping();

        // Test Blob Token Presence (Static check)
        const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

        return NextResponse.json({
            status: 'ok',
            redis: 'connected',
            blob_configured: hasBlobToken,
            env: process.env.NODE_ENV
        });
    } catch (err: any) {
        console.error('Health Check Failed:', err);
        return NextResponse.json({
            status: 'error',
            error: err.message
        }, { status: 500 });
    }
}
