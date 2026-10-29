import React from 'react';
import clsx from 'clsx';

type CyberButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' };
export const CyberButton: React.FC<CyberButtonProps> = ({ className, variant = 'primary', children, ...props }) => <button className={clsx('cyber-button', `cyber-button--${variant}`, className)} {...props}>{children}</button>;
