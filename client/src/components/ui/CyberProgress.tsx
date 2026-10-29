import React from 'react';
import clsx from 'clsx';

type CyberProgressProps = { value: number; label?: string; valueLabel?: string; tone?: 'default' | 'network' | 'danger' | 'economy'; className?: string };
export const CyberProgress: React.FC<CyberProgressProps> = ({ value, label, valueLabel, tone = 'default', className }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div className={clsx('cyber-progress', `cyber-progress--${tone}`, className)}>
    {(label || valueLabel) && <div className="cyber-progress__labels"><span>{label}</span><span>{valueLabel ?? `${safeValue}%`}</span></div>}
    <div className="cyber-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><span style={{ width: `${safeValue}%` }} /></div>
  </div>;
};
