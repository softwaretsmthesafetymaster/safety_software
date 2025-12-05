import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? {  scale: 1.01 } : undefined}
      
      className={`card-modern ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
