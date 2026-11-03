import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Fade/slide an element into view once. Respects prefers-reduced-motion.
 */
const Reveal = ({ children, delay = 0, y = 22, className = '', as = 'div' }) => {
    const reduceMotion = useReducedMotion();
    const MotionTag = motion[as] || motion.div;

    return (
        <MotionTag
            className={className}
            initial={reduceMotion ? false : { opacity: 0, y }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </MotionTag>
    );
};

export default Reveal;
