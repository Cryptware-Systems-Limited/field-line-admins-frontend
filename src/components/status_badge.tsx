import type { Station } from '../types';

export function StatusBadge({ status }: { status: Station['status'] }) {
    return (
        <span className={`status status--${status.toLowerCase()}`}>
        <i />
        {status.replace('_', ' ')}
        </span>
    );
}

export function OnboardingBadge({ onboarded }: { onboarded: boolean }) {
    return (
        <span className={`status ${onboarded ? 'status--active' : 'status--draft'}`}>
        <i />
        {onboarded ? 'ONBOARDED' : 'PENDING'}
        </span>
    );
}