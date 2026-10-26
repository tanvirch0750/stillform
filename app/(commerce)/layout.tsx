import type { ReactNode } from 'react';
import CommerceFrame from '../../components/commerce/CommerceFrame';

export default function CommerceLayout({ children }: { children: ReactNode }) {
  return <CommerceFrame>{children}</CommerceFrame>;
}
