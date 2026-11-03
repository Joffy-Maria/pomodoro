import React from 'react';

const Logo = ({ size = 36, showText = true, className = '' }) => {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <span
                className="relative grid shrink-0 place-items-center rounded-[0.7rem] shadow-[0_10px_30px_-12px_rgba(124,92,255,0.9)]"
                style={{
                    width: size,
                    height: size,
                    background: 'linear-gradient(145deg, #7c5cff 0%, #6443e8 45%, #ff6b5e 130%)',
                }}
            >
                <svg
                    viewBox="0 0 24 24"
                    width={size * 0.6}
                    height={size * 0.6}
                    fill="none"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" strokeOpacity="0.95" />
                    <path
                        d="M12 7.4v5.1l3.4 2"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
            {showText && (
                <span className="font-display text-[1.05rem] font-bold tracking-tight text-white">
                    Promate
                </span>
            )}
        </span>
    );
};

export default Logo;
