import React from 'react';

export interface DrilldownLinkProps {
  id: string;
  type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl' | string;
  label?: string;
  className?: string;
  onNavigate?: (id: string, type: any) => void;
}

export function DrilldownLink({ id, type, label, className, onNavigate }: DrilldownLinkProps) {
  return (
    <span 
      className={`cursor-pointer hover:underline text-blue-400 font-medium transition-colors ${className || ''}`} 
      data-nav-id={id}
      data-nav-type={type}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onNavigate?.(id, type);
      }}
      title={`Double-click to inspect ${type}: ${id}`}
    >
      {label || id}
    </span>
  );
}
