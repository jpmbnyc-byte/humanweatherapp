import { createFileRoute } from '@tanstack/react-router';
import HarnessDebugPage from '@/components/harness/HarnessDebugPage';

export const Route = createFileRoute('/debug/harness')({
  ssr: false,
  component: HarnessDebugPage,
});
