import React from 'react';
export const Separator = ({ className = '' }: { className?: string }) => (
  <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />
);
