type LoadGateProps = {
  children: React.ReactNode;
  fallbackClassName?: string;
};

export function LoadGate({ children }: LoadGateProps) {
  return <>{children}</>;
}
