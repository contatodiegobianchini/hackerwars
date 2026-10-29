import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type CyberMetricProps = { label: string; value: React.ReactNode; detail?: React.ReactNode; icon?: LucideIcon; tone?: 'default' | 'network' | 'danger' | 'economy'; className?: string };
export const CyberMetric: React.FC<CyberMetricProps> = ({ label, value, detail, icon: Icon, tone = 'default', className }) => (
  <div className={clsx('cyber-metric', `cyber-metric--${tone}`, className)}>
    <div className="cyber-metric__label">{Icon && <Icon aria-hidden="true" />}{label}</div>
    <strong className="cyber-metric__value">{value}</strong>
    {detail && <span className="cyber-metric__detail">{detail}</span>}
  </div>
);
