import React from 'react';
import { X } from 'lucide-react';
import type { ChatCitation } from '../../pages/Chat/ChatPage';

interface SourcesModalProps {
  open: boolean;
  onClose: () => void;
  citations: ChatCitation[];
}

const SourcesModal: React.FC<SourcesModalProps> = ({ open, onClose, citations }) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="glass-subtle rounded-3xl border border-ink-muted/10 dark:border-paper-light/10 shadow-xl max-w-2xl w-full overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-muted/10 dark:border-paper-light/10">
            <div>
              <h3 className="text-lg font-serif text-ink-primary dark:text-paper-light">Sources</h3>
              <p className="text-xs text-ink-secondary dark:text-ink-muted">Only shown when retrieval is confident.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-ink-muted/10 dark:border-paper-light/10 hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-ink-primary dark:text-paper-light" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
            {citations.length === 0 ? (
              <p className="text-sm text-ink-secondary dark:text-ink-muted">No sources available.</p>
            ) : (
              citations.map((c) => (
                <div key={`${c.filePath}:${c.chunkIndex}`} className="rounded-2xl border border-ink-muted/10 dark:border-paper-light/10 p-4">
                  <div className="text-xs text-ink-secondary dark:text-ink-muted">
                    <div className="font-mono break-all">{c.filePath}</div>
                    {c.headingPath.length > 0 ? (
                      <div className="mt-1">
                        {c.headingPath.join(' / ')} · chunk {c.chunkIndex + 1}
                      </div>
                    ) : (
                      <div className="mt-1">chunk {c.chunkIndex + 1}</div>
                    )}
                  </div>
                  <div className="mt-3 text-sm whitespace-pre-wrap text-ink-primary dark:text-paper-light">
                    {c.excerpt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SourcesModal;


