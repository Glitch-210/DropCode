"use client";
import React, { useEffect, useState } from 'react';

export default function ScreenLoader({ onComplete }: { onComplete?: () => void }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        "SEALING FILE",
        "BURNING LINK",
        "SETTING EXPIRY",
        "DO NOT REFRESH",
        "(YOU WILL ANYWAY)"
    ];

    useEffect(() => {
        // Since the prompt asks for a "loop", but we technically wait for onComplete from the parent (Upload/Download)
        // We will just let it loop indefinitely until unmounted.
        const interval = setInterval(() => {
            setMsgIndex((current) => (current + 1) % messages.length);
        }, 3000); // Change text every 3s (matches animation loop roughly)

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[var(--color-bg-body)]">

            {/* The Box */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer Frame - Squashes */}
                <div
                    className="absolute w-full h-full border-black bg-white animate-compress"
                    style={{
                        borderStyle: 'solid',
                        boxShadow: '8px 8px 0 rgba(0,0,0,0.1)'
                    }}
                ></div>

                {/* Inner Lock/Symbol - Snaps in */}
                <div className="absolute z-10 w-12 h-12 bg-black animate-lock"></div>
            </div>

            {/* Microcopy */}
            <div className="mt-12 h-8 flex items-center justify-center">
                <p className="font-bold font-mono text-xl tracking-widest uppercase">
                    {messages[msgIndex]}
                </p>
            </div>

            {/* Subtext */}
            <div className="mt-2 opacity-50 font-mono text-xs uppercase">
                DropCode v2.0
            </div>
        </div>
    );
}
