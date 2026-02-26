import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/ui/PageTransition';
import { Sparkles } from 'lucide-react';

const Intro = () => {
    const [isCollapsing, setIsCollapsing] = useState(false);
    const navigate = useNavigate();

    const handleEnter = () => {
        setIsCollapsing(true);
        // Wait for collapse animation then navigate
        setTimeout(() => {
            navigate('/home');
        }, 1200);
    };

    return (
        <PageTransition transitionType="morph">
            <div
                className="w-full h-screen fixed inset-0 cursor-pointer bg-[#020202] overflow-hidden perspective-[1000px]"
                onClick={handleEnter}
            >
                {/* 3D CSS Tunnel Container */}
                <div
                    className={`absolute inset-0 flex items-center justify-center transform-style-3d transition-transform duration-1000 ease-in-out ${isCollapsing ? 'scale-0 opacity-0 rotate-[180deg]' : 'scale-100 opacity-100'
                        }`}
                >
                    <div className="css-tunnel">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="tunnel-ring" style={{ '--ring-idx': i }}></div>
                        ))}
                    </div>
                </div>

                {/* Center Text Component */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-700 ${isCollapsing ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                        }`}
                >
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] filter mix-blend-screen animate-pulse">
                        PROMATE
                    </h1>
                </div>

                {/* Overlay Prompt */}
                <div className={`absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-500 ${isCollapsing ? 'opacity-0' : 'opacity-80'}`}>
                    <div className="flex items-center gap-3 text-white/50 animate-bounce">
                        <Sparkles size={16} className="text-pink-400" />
                        <span className="tracking-[0.4em] text-xs uppercase font-medium text-pink-200">
                            Click Anywhere To Begin
                        </span>
                        <Sparkles size={16} className="text-pink-400" />
                    </div>
                </div>
            </div>

            {/* Inject specific CSS animation logic for the pure CSS tunnel */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                .css-tunnel {
                    position: absolute;
                    width: 200vw;
                    height: 200vh;
                    transform-style: preserve-3d;
                    perspective: 120px;
                }
                .tunnel-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100vw;
                    height: 100vh;
                    border: 2px solid rgba(168, 85, 247, 0.4);
                    box-shadow: 
                       0 0 50px rgba(168, 85, 247, 0.2) inset,
                       0 0 100px rgba(236, 72, 153, 0.1);
                    border-radius: 50%;
                    transform: translate(-50%, -50%) translateZ(var(--z));
                    animation: tunnel-fly 5s infinite linear;
                    animation-delay: calc(var(--ring-idx) * -0.25s);
                    opacity: 0;
                }
                
                /* Slight variations to make it feel organic and spinning */
                .tunnel-ring:nth-child(even) {
                    border-color: rgba(236, 72, 153, 0.3);
                    border-radius: 40%;
                }

                @keyframes tunnel-fly {
                    0% {
                        transform: translate(-50%, -50%) translateZ(-800px) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) translateZ(100px) rotate(90deg);
                        opacity: 0;
                    }
                }
            `}} />
        </PageTransition>
    );
};

export default Intro;
