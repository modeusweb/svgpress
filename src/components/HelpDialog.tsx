'use client';

import { Modal } from '@/components/ui/Modal';

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="How SVGPress works" size="md"
      description="Batch-optimize SVGs entirely in your browser."
    >
      <div className="space-y-4 text-sm text-muted">
        <Section title="1. Add files">
          Drop SVG files onto the upload zone or browse to select them. Files are read into memory
          in your browser and are <strong className="text-content">never uploaded</strong> anywhere.
        </Section>
        <Section title="2. Tune settings">
          Open Settings to pick a preset (Balanced, Maximum, Safe) or customize individual
          optimization options. Aggressive options like merging paths or cleaning IDs can affect
          how the SVG integrates with external CSS/JS - they are marked as risky.
        </Section>
        <Section title="3. Optimize">
          Click <strong className="text-content">Optimize all</strong>. SVGO runs in a background
          worker so the interface stays responsive. Each file shows its own status and size savings.
        </Section>
        <Section title="4. Download">
          Download individual results or grab everything at once as a ZIP archive containing only
          the successfully optimized files.
        </Section>
        <Note>
          <strong className="text-content">Security:</strong> Previews are rendered from isolated
          image blobs, so scripts and external references inside an SVG never execute. Optimization
          reduces size but is not a security sanitizer - always review SVGs from untrusted sources.
        </Note>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-content">{title}</h3>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-ctl border border-warning/30 bg-warning-soft p-3 leading-relaxed text-content">
      {children}
    </div>
  );
}
