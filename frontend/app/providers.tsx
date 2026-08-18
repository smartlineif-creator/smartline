import { SessionBootstrap } from '@/components/SessionBootstrap';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionBootstrap />
      {children}
    </>
  );
}
