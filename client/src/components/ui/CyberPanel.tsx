import React from 'react';
import clsx from 'clsx';

type CyberPanelProps = React.HTMLAttributes<HTMLDivElement> & { accent?: boolean };
export const CyberPanel: React.FC<CyberPanelProps> = ({ accent = false, className, children, ...props }) => (
  <section className={clsx('cyber-panel', accent && 'cyber-panel--accent', className)} {...props}>{children}</section>
);
