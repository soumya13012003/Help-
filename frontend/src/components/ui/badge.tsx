import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'critical' | 'warning' | 'success';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    default: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100',
    critical: 'border-transparent bg-[#D32F2F] text-white hover:bg-[#D32F2F]/80',
    warning: 'border-transparent bg-[#F57C00] text-white hover:bg-[#F57C00]/80',
    success: 'border-transparent bg-[#388E3C] text-white hover:bg-[#388E3C]/80',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
