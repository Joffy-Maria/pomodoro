import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const CARDS = [
    {
        id: 1,
        title: 'Create a Room',
        subtitle: 'Shareable Pomodoro Sessions',
        description: 'Configure focus time, select a 3D background, and share the code link for others to join instantly.',
        color: 'from-pink-500/20 to-purple-600/20',
        border: 'border-pink-500/30 text-pink-300'
    },
    {
        id: 2,
        title: 'Pomodoro Session',
        subtitle: 'Solo Focus Power',
        description: 'Jump straight into a private flow-state room. Ephemeral setup, no distractions, highly aesthetic.',
        color: 'from-purple-500/20 to-indigo-600/20',
        border: 'border-purple-500/30 text-purple-300'
    },
    {
        id: 3,
        title: 'User Manual',
        subtitle: 'How to use Promate',
        description: 'Learn how to generate ephemerals rooms, synchronize timers with friends, and manage live task lists.',
        color: 'from-blue-500/20 to-emerald-600/20',
        border: 'border-emerald-500/30 text-emerald-300'
    }
];

export default function FeatureCarousel({ onSelectFeature }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % CARDS.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
    };

    const handleCardClick = (id) => {
        onSelectFeature(id);
    };

    return (
        <div className="relative w-full max-w-4xl h-[350px] md:h-[450px] flex flex-col items-center justify-center perspective-[1000px] md:perspective-[1500px]">

            {/* 3D Carousel Stage */}
            <div className="relative w-full max-w-[700px] h-[300px] md:h-[400px] transform-style-3d flex items-center justify-center">

                {/* Navigation Arrows */}
                <button
                    onClick={handlePrev}
                    className="absolute -left-12 md:-left-28 z-30 p-3 md:p-6 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur border border-white/10 transition-all text-white/50 hover:text-white"
                >
                    <ChevronLeft size={32} />
                </button>

                <AnimatePresence initial={false} mode="popLayout">
                    {CARDS.map((card, idx) => {
                        const isActive = idx === activeIndex;
                        const xOffset = isActive ? 0 : (activeIndex === 0 ? 80 : -80);
                        const zOffset = isActive ? 0 : -100;
                        const yRotation = isActive ? 0 : (activeIndex === 0 ? -15 : 15);

                        return (
                            <motion.div
                                key={card.id}
                                layoutId={`card-${card.id}`}
                                onClick={() => handleCardClick(card.id)}
                                initial={false}
                                animate={{
                                    x: xOffset,
                                    z: zOffset,
                                    rotateY: yRotation,
                                    scale: isActive ? 1 : 0.85,
                                    opacity: isActive ? 1 : 0.4,
                                    filter: isActive ? 'blur(0px)' : 'blur(4px)',
                                    zIndex: isActive ? 10 : 0
                                }}
                                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                className={`absolute inset-0 cursor-pointer rounded-[2rem] p-6 md:p-12 flex flex-col justify-between 
                            bg-gradient-to-br ${card.color} border border-b-0 backdrop-blur-xl 
                            shadow-3xl overflow-hidden hover:shadow-purple-500/50 transition-shadow duration-500 mx-auto w-[85%] md:w-[600px] h-[280px] md:h-[350px]`}
                                style={{
                                    transformStyle: 'preserve-3d',
                                    borderTopColor: 'rgba(255,255,255,0.2)',
                                    borderLeftColor: 'rgba(255,255,255,0.1)',
                                    borderRightColor: 'rgba(255,255,255,0.05)',
                                }}
                            >
                                {/* Subtle noise inside the card */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                                <div className="relative z-10 text-left pointer-events-none">
                                    <h3 className={`text-xs md:text-base font-bold tracking-widest uppercase mb-2 md:mb-4 ${card.border}`}>{card.title}</h3>
                                    <p className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 md:mb-5 leading-tight">{card.subtitle}</p>
                                </div>

                                <div className="relative z-10 pointer-events-none text-left">
                                    <p className="text-sm md:text-lg font-light leading-relaxed text-white/70">{card.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <button
                    onClick={handleNext}
                    className="absolute -right-12 md:-right-28 z-30 p-3 md:p-6 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur border border-white/10 transition-all text-white/50 hover:text-white"
                >
                    <ChevronRight size={32} />
                </button>

            </div>

            {/* Navigation Indicators */}
            <div className="mt-6 flex gap-3 z-20">
                {CARDS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${activeIndex === idx
                            ? 'bg-purple-400 w-8 shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                            : 'bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>

        </div>
    );
}
