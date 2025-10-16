import { useMemo } from 'react';

export interface DiagnosticsSnapshot {
  projectId: string | undefined;
  origin: string;
  lastQuery: Record<string, string | undefined> | null;
  lastStatus: string;
  lastError?: string;
  attemptedId?: string;
  fallbackAttempted?: string;
}

interface DiagnosticsProps {
  snapshot: DiagnosticsSnapshot;
}

export const Diagnostics = ({ snapshot }: DiagnosticsProps) => {
  const formatted = useMemo(
    () =>
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          ...snapshot,
        },
        null,
        2,
      ),
    [snapshot],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
    } catch (error) {
      console.error('Failed to copy diagnostics snapshot', error);
    }
  };

  return (
    <section className="diagnostics">
      <h2>Diagnostics</h2>
      <pre>{formatted}</pre>
      <button type="button" onClick={handleCopy}>
        Copy Debug Snapshot
      </button>
    </section>
  );
};
