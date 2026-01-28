import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Only allow uploads to the "uploads" folder
                // The structure will be uploads/{shareCode}/{filename}
                if (!pathname.startsWith('uploads/')) {
                    throw new Error('Invalid upload path');
                }

                return {
                    allowedContentTypes: [
                        "image/*",
                        "application/pdf",
                        "application/zip",
                        "text/plain",
                        "application/octet-stream"
                    ],
                    tokenPayload: JSON.stringify({
                        // could store user info here
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // We will handle metadata registration in a separate API call
                // This keeps this endpoint purely for token generation
                console.log('blob uploaded', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times automatically if the status code is 500
        );
    }
}
