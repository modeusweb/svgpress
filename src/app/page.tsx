import { OptimizerClient } from '@/components/OptimizerClient';

// The workspace is a client component; it renders a static HTML shell that
// hydrates in the browser. This is compatible with `output: 'export'`.
export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <OptimizerClient />
    </div>
  );
}
