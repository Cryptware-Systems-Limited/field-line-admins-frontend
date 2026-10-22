import { ShieldCheck } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`brand ${compact ? 'brand--compact' : ''}`}>
        <span className="brand__mark">
            <ShieldCheck size={compact ? 22 : 27} />
        </span>
        <span>
            <strong>Field-Line</strong>
            <small>Command & Control</small>
        </span>
        </div>
    );
}