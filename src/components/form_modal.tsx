import { FormEvent, ReactNode, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

import { getError } from '../utils/errors';
import { ModalHeader } from './modal_header';

type Props = {
  eyebrow: string;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  children: ReactNode;
};

export function FormModal({ eyebrow, title, submitLabel, onClose, onSubmit, children }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit();
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <ModalHeader eyebrow={eyebrow} title={title} onClose={onClose} />
        <form onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}
          {children}
          <footer>
            <button type="button" className="button button--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="button button--primary" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} {submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}