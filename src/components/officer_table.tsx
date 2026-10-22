import { Trash2 } from 'lucide-react';

import { OnboardingBadge } from '../components/status_badge';
import type { Officer } from '../types';

type Props = { officers: Officer[]; onSelect: (officerId: string) => void; onRemove: (officer: Officer) => void };

export function OfficersTable({ officers, onSelect, onRemove }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Officer</th>
            <th>Service number</th>
            <th>Rank / unit</th>
            <th>Mobile status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {officers.map((officer) => {
            const { firstName, lastName, personnelNumber, rankOrPosition, department } = officer.personnelProfile;
            return (
              <tr
                key={officer.id}
                className="officer-row"
                tabIndex={0}
                onClick={() => onSelect(officer.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(officer.id);
                  }
                }}
              >
                <td>
                  <span className="station-cell">
                    <span className="avatar">{firstName[0]}</span>
                    <span>
                      <strong>
                        {firstName} {lastName}
                      </strong>
                      <small>{officer.email}</small>
                    </span>
                  </span>
                </td>
                <td>{personnelNumber}</td>
                <td>{rankOrPosition || department || 'Not specified'}</td>
                <td>
                  <OnboardingBadge onboarded={officer.devices.length > 0} />
                </td>
                <td className="row-actions">
                  <button
                    className="remove-officer-button"   
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(officer);
                    }}
                    aria-label={`Remove ${firstName} ${lastName}`}
                    title="Remove officer"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}