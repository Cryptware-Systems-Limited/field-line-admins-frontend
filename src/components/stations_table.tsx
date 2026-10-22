import { Building2, ChevronRight } from 'lucide-react';

import { StatusBadge } from './status_badge';
import type { Station } from '../types';

export function StationsTable({ stations, onSelect }: { stations: Station[]; onSelect: (station: Station) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Station</th>
            <th>Location</th>
            <th>Command</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station.id} onClick={() => onSelect(station)}>
              <td>
                <span className="station-cell">
                  <span className="station-symbol">
                    <Building2 size={18} />
                  </span>
                  <span>
                    <strong>{station.name}</strong>
                    <small>{station.code}</small>
                  </span>
                </span>
              </td>
              <td>
                {station.city}, {station.state}
              </td>
              <td>{station.command || 'Not specified'}</td>
              <td>
                <StatusBadge status={station.status} />
              </td>
              <td>
                <ChevronRight size={18} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}