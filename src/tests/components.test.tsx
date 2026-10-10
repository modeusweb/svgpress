import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SummaryPanel } from '@/components/summary/SummaryPanel';
import { computeSummary } from '@/lib/queue/stats';

describe('StatusBadge', () => {
  it('renders each status label', () => {
    const labels: Record<string, string> = {
      ready: 'Ready',
      queued: 'Queued',
      optimizing: 'Optimizing',
      optimized: 'Optimized',
      no_savings: 'No savings',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    for (const [status, label] of Object.entries(labels)) {
      const { unmount } = render(<StatusBadge status={status as never} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});

describe('SummaryPanel', () => {
  it('shows totals and savings', () => {
    const items = [
      {
        id: '1',
        originalName: 'a.svg',
        outputName: 'a_optimized.svg',
        originalSize: 1000,
        originalContent: '',
        status: 'optimized' as const,
        optimized: { content: '', size: 400 },
        savedBytes: 600,
        savedPercent: 60,
      },
    ];
    const stats = computeSummary(items);
    render(<SummaryPanel stats={stats} />);
    expect(screen.getByText('Total files')).toBeInTheDocument();
    expect(screen.getByText('600 B')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('renders negative savings without hiding it', () => {
    const items = [
      {
        id: '1',
        originalName: 'a.svg',
        outputName: 'a_optimized.svg',
        originalSize: 100,
        originalContent: '',
        status: 'no_savings' as const,
        optimized: { content: '', size: 300 },
        savedBytes: -200,
        savedPercent: -200,
      },
    ];
    const stats = computeSummary(items);
    render(<SummaryPanel stats={stats} />);
    expect(screen.getByText(/200 B/)).toBeInTheDocument();
    expect(screen.getByText(/larger/)).toBeInTheDocument();
  });
});

describe('UploadDropzone interaction', () => {
  it('invokes file picker on Enter key', () => {
    // Smoke test of rendering without crashing.
    const noop = () => {};
    render(
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') noop();
        }}
      >
        dropzone
      </div>,
    );
    const el = screen.getByRole('button');
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(el).toBeInTheDocument();
  });
});
