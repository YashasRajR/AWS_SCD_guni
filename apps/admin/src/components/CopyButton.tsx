import { useState } from 'react';

/** Copies `text` to the clipboard on click, briefly confirming it worked.
 * Used for the social-post generator (spec #28) and anywhere else a
 * one-click copy beats a text field the admin has to select manually. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or denied (e.g. insecure context) — the
      // admin can still select and copy the text manually.
    }
  };

  return (
    <button type="button" className="btn-link" onClick={handleCopy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
