import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveButton = ({ children, onClick, className = '', variant = 'primary', type = 'button' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseClasses =
        'relative overflow-hidden inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium tracking-wide transition-colors duration-300';

    const variants = {
        primary:
            'bg-brand-500 text-white hover:bg-brand-400 shadow-[0_12px_30px_-14px_rgba(124,92,255,0.9)]',
        secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
        ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    };

    // Generate spark particles once per mount.
    const [sparks] = useState(() =>
        Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            angle: (i * Math.PI * 2) / 12 + Math.random(),
            delay: Math.random() * 0.2,
            duration: 0.6 + Math.random() * 0.4,
            scale: Math.random() * 1.5 + 0.5,
            color: i % 3 === 0 ? 'bg-focus-400' : 'bg-brand-300',
        }))
    );

    return (
        <motion.button
            type={type}
            className={`${baseClasses} ${variants[variant] ?? variants.primary} ${className}`}
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{
                scale: 1.05,
                boxShadow:
                    variant === 'primary'
                        ? '0 0 24px rgba(124, 92, 255, 0.45)'
                        : '0 0 16px rgba(255,255,255,0.1)',
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {/* Sparkle burst on hover */}
            <span className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <AnimatePresence>
                    {isHovered &&
                        sparks.map((spark) => (
                            <motion.span
                                key={spark.id}
                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: 0,
                                    scale: spark.scale,
                                    x: Math.cos(spark.angle) * 40,
                                    y: Math.sin(spark.angle) * 40,
                                }}
                                transition={{
                                    duration: spark.duration,
                                    delay: spark.delay,
                                    repeat: Infinity,
                                }}
                                className={`absolute h-1.5 w-1.5 rounded-full ${spark.color}`}
                            />
                        ))}
                </AnimatePresence>
            </span>

            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
};

export default InteractiveButton;
