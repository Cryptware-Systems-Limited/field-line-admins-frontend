import { Monitor, Smartphone } from 'lucide-react';

export type OfficerKind = 'FIELD' | 'STATION';

export const officerKindLabels: Record<OfficerKind, string> = {
  FIELD: 'Field officers',
  STATION: 'Station officers',
};

type Props = {
  value: OfficerKind;
  onChange: (kind: OfficerKind) => void;
  counts?: Record<OfficerKind, number>;
  disabled?: boolean;
};

export function OfficerKindToggle({ value, onChange, counts, disabled }: Props) {
  return (
    <div className="officer-kind-toggle" role="group" aria-label="Officer type" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 440 }}>
      {(['FIELD', 'STATION'] as const).map((kind) => (
        <button key={kind} type="button" className={`button ${value === kind ? 'button--primary' : 'button--ghost'}`} aria-pressed={value === kind} onClick={() => onChange(kind)} disabled={disabled}>
          {kind === 'FIELD' ? <Smartphone size={17} /> : <Monitor size={17} />} {officerKindLabels[kind]}
          {counts ? ` (${counts[kind]})` : ''}
        </button>
      ))}
    </div>
  );
}