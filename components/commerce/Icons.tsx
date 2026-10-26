import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
export const BagIcon = (props: Props) => <svg {...base} {...props}><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></svg>;
export const ArrowIcon = (props: Props) => <svg {...base} {...props}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
export const CloseIcon = (props: Props) => <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
export const LockIcon = (props: Props) => <svg {...base} {...props}><rect x="5" y="10" width="14" height="11" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></svg>;
export const CheckIcon = (props: Props) => <svg {...base} {...props}><path d="m5 12 4 4L19 6" /></svg>;
