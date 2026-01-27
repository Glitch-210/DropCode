"use client";
import React, { useEffect, useState } from 'react';

export default function ScreenLoader({ onComplete }: { onComplete?: () => void }) {
    const [phase, setPhase] = useState<'DROP' | 'IMPACT' | 'CODE'>('DROP');

    useEffect(() => {
        // Timeline:
        // 0ms: Start Drop
        // 600ms: Impact (Drop hits center)
        // 600ms: Burst starts, Drop disappears
        // 650ms: Code reveals
        // 1700ms: Complete

        const impactTimer = setTimeout(() => {
            setPhase('IMPACT');
        }, 600);

        const codeTimer = setTimeout(() => {
            setPhase('CODE');
        }, 650);

        const endTimer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 1800);

        return () => {
            clearTimeout(impactTimer);
            clearTimeout(codeTimer);
            clearTimeout(endTimer);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900 overflow-hidden">
            {/* Phase 1: The Drop */}
            {phase === 'DROP' && (
                <div
                    className="absolute w-8 h-8 bg-white animate-drop"
                    style={{
                        top: '50%',
                        left: '50%',
                        marginLeft: '-1rem', // Center alignment fix
                        marginTop: '-1rem'   // Center alignment fix
                    }}
                ></div>
            )}

            {/* Phase 2: Impact / Shards */}
            {phase === 'IMPACT' && (
                <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Shards expanding outwards */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-6 bg-white animate-burst origin-center"
                            style={{
                                transform: `rotate(${deg}deg)`,
                                '--tx': `${Math.cos(deg * Math.PI / 180) * 80}px`, // Move outward
                                '--ty': `${Math.sin(deg * Math.PI / 180) * 80}px`,
                            } as React.CSSProperties}
                        ></div>
                    ))}
                </div>
            )}

            {/* Phase 3: The Code */}
            {(phase === 'IMPACT' || phase === 'CODE') && (
                <div className={`absolute z-10 flex flex-col items-center ${phase === 'CODE' ? 'opacity-100' : 'opacity-0'}`}>
                    <h1
                        className="text-6xl font-black text-white tracking-widest animate-code font-mono"
                        style={{
                            textShadow: '0 0 20px rgba(255,255,255,0.2)'
                        }}
                    >
                        HJ7MC
                    </h1>
                </div>
            )}
        </div>
    );
}
