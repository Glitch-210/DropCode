import "server-only";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Authenticate user here if needed
                return {
                    allowedContentTypes: ['*/*'],
                    maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
                    tokenPayload: JSON.stringify({
                        // optional payload
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Notification logic if needed
                console.log('blob uploaded', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}
