"use client";
import React, { useEffect, useState } from 'react';

export default function ScreenLoader({ onComplete, messages }: { onComplete?: () => void, messages?: string[] }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const defaultMessages = [
        "INITIALIZING",
        "LOADING ASSETS",
        "PREPARING DROP",
    ];
    const msgs = messages || defaultMessages;

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((current) => (current + 1) % msgs.length);
        }, 1500);

        // If onComplete is provided, trigger it after a set time (e.g. 2s)
        // so it doesn't loop forever as a splash screen.
        let timeout: NodeJS.Timeout;
        if (onComplete) {
            timeout = setTimeout(() => {
                onComplete();
            }, 2000);
        }

        return () => {
            clearInterval(interval);
            if (timeout) clearTimeout(timeout);
        };
    }, [onComplete, msgs.length]);

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
                    {msgs[msgIndex]}
                </p>
            </div>

            {/* Subtext */}
            <div className="mt-2 opacity-50 font-mono text-xs uppercase">
                DropCode v2.0
            </div>
        </div>
    );
}
