import "server-only";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as HandleUploadBody;

        const response = await handleUpload({
            request: req,
            body,

            onBeforeGenerateToken: async () => {
                return {
                    // ✅ allow all file types (safe for now)
                    allowedContentTypes: ["*/*"],

                    // ✅ keep reasonable limit for Vercel
                    maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
                };
            },

            onUploadCompleted: async ({ blob }) => {
                // optional logging
                console.log("Upload complete:", blob.url);
            },
        });

        return NextResponse.json(response);
    } catch (err) {
        console.error("Blob upload error:", err);

        return NextResponse.json(
            { error: "Blob upload failed" },
            { status: 500 }
        );
    }
}
