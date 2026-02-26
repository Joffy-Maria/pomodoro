import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveButton = ({ children, onClick, className = "", variant = "primary" }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseClasses = "relative overflow-hidden inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium tracking-wide transition-colors duration-300";

    const variants = {
        primary: "bg-purple-600/80 text-white hover:bg-purple-500",
        secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/10",
        ghost: "text-white/70 hover:text-white hover:bg-white/5",
    };

    // Generate random spark particles
    const sparks = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        angle: (i * Math.PI * 2) / 12 + Math.random(),
        delay: Math.random() * 0.2
    }));

    return (
        <motion.button
            className={`${baseClasses} ${variants[variant]} ${className}`}
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{
                scale: 1.05,
                boxShadow: variant === 'primary' ? "0 0 20px rgba(168, 85, 247, 0.5)" : "0 0 15px rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {/* CSS Particle Sparkles */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
                <AnimatePresence>
                    {isHovered && sparks.map(spark => (
                        <motion.div
                            key={spark.id}
                            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                            animate={{
                                opacity: 0,
                                scale: Math.random() * 1.5 + 0.5,
                                x: Math.cos(spark.angle) * 40,
                                y: Math.sin(spark.angle) * 40
                            }}
                            transition={{ duration: 0.6 + Math.random() * 0.4, delay: spark.delay, repeat: Infinity }}
                            className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Button Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};

export default InteractiveButton;
