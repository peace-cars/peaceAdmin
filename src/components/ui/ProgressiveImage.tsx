import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProgressiveImage({ src, alt, className = '' }: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-bg-tertiary ${className}`}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg-tertiary animate-pulse"
          />
        )}
      </AnimatePresence>
      <img
        src={hasError ? 'https://via.placeholder.com/800x600?text=Image+Unavailable' : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
