import { Trash2 } from 'lucide-react';

import type { StationOfficer } from '../types';

type Props = { officers: StationOfficer[]; onRemove: (officer: StationOfficer) => void };

export function StationOfficersTable({ officers, onRemove }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Officer</th>
            <th>Service number</th>
            <th>Rank / unit</th>
            <th>Added</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {officers.map((officer) => {
            const { firstName, lastName, personnelNumber, rankOrPosition, department } = officer.personnelProfile;
            return (
              <tr key={officer.id}>
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
                <td>{new Date(officer.createdAt).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button className="remove-officer-button" onClick={() => onRemove(officer)} aria-label={`Remove ${firstName} ${lastName}`} title="Remove officer">
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