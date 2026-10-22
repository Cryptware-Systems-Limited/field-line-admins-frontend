import type { ReactNode } from 'react';

type Props = {
    icon: ReactNode;
    tone: 'blue' | 'green' | 'amber';
    label: string;
    value: number;
    caption: string;
};

export function StatCard({ icon, tone, label, value, caption }: Props) {
    return (
        <article>
        <span className={`metric-icon metric-icon--${tone}`}>{icon}</span>
        <div>
            <small>{label}</small>
            <strong>{value}</strong>
            <em>{caption}</em>
        </div>
        </article>
    );
}