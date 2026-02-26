import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children, transitionType = "morph" }) => {
    const variants = {
        morph: {
            initial: { opacity: 0, scale: 0.8, filter: 'blur(20px)' },
            animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            exit: { opacity: 0, scale: 1.2, filter: 'blur(20px)' }
        },
        slideMap: {
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -50 }
        }
    };

    const selectedVariant = variants[transitionType] || variants.morph;

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={selectedVariant}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // smooth cubic bezier
            className="w-full h-full absolute inset-0"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
