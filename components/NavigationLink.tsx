'use client';

import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, MouseEvent } from 'react';
import { useLoading } from '@/app/providers/LoadingProvider';

type NavigationLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export default function NavigationLink({ href, children, className, onClick, ...props }: NavigationLinkProps) {
  const { setLoading } = useLoading();
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = href.toString();
    // Don't trigger for hash links or same-page navigation
    if (!target.startsWith('#') && target !== pathname) {
      setLoading(true);
    }
    if (onClick) onClick(e);
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
