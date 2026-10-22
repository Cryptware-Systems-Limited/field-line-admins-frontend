import { ArrowLeft, X } from 'lucide-react';

export function ModalHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
    return (
        <header>
        <button className="back-button" onClick={onClose}>
            <ArrowLeft size={19} />
        </button>
        <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
        </div>
        <button className="icon-button" onClick={onClose}>
            <X />
        </button>
        </header>
    );
}