
import React from 'react';

interface AnimatedGradientProps {
  className?: string;
}

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute opacity-20 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/80 via-primary/40 to-transparent animate-pulse-slow -top-40 -left-40" />
      <div className="absolute opacity-20 w-[600px] h-[600px] rounded-full bg-gradient-to-l from-primary/80 via-primary/40 to-transparent animate-pulse-slow -bottom-20 -right-20" />
      <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0,#ffffff_100%)]" />
    </div>
  );
};

export default AnimatedGradient;
