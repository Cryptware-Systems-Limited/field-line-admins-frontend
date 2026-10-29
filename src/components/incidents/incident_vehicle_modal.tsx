import { useState } from 'react';

import { api } from '../../api';
import type { IncidentVehicle, UpsertIncidentVehicleInput } from '../../types';
import { compact } from '../../utils/errors';
import { driverOwnerStatusOptions, newId, vehicleRoleOptions, vehicleTypeOptions } from '../../utils/incident_options';
import { SelectField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incidentId: string; vehicle?: IncidentVehicle; onClose: () => void; onSaved: () => void };

export function IncidentVehicleModal({ token, incidentId, vehicle, onClose, onSaved }: Props) {
  const [vehicleId] = useState(() => vehicle?.id ?? newId());
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber ?? '',
    type: vehicle?.type ?? '',
    makeModel: vehicle?.makeModel ?? '',
    colour: vehicle?.colour ?? '',
    role: vehicle?.role ?? '',
    driverOwnerStatus: vehicle?.driverOwnerStatus ?? '',
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    await api.upsertIncidentVehicle(token, incidentId, vehicleId, compact<UpsertIncidentVehicleInput>({ ...form, plateNumber: form.plateNumber.trim().toUpperCase() }));
    onSaved();
  }

  return (
    <FormModal eyebrow="Vehicles" title={vehicle ? 'Edit vehicle' : 'Add vehicle'} submitLabel={vehicle ? 'Save vehicle' : 'Add vehicle'} onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>Vehicle details</h3>
        <div className="form-grid">
          <TextField label="Plate number" value={form.plateNumber} onChange={set('plateNumber')} placeholder="KTU 482 QA" />
          <SelectField label="Vehicle type" value={form.type} onChange={set('type')} options={vehicleTypeOptions} placeholder="Select type" required />
          <TextField label="Make / model" value={form.makeModel} onChange={set('makeModel')} placeholder="Bajaj Boxer" />
          <TextField label="Colour" value={form.colour} onChange={set('colour')} placeholder="Red" />
          <SelectField label="Role in incident" value={form.role} onChange={set('role')} options={vehicleRoleOptions} placeholder="Select role" required />
          <SelectField label="Driver / owner" value={form.driverOwnerStatus} onChange={set('driverOwnerStatus')} options={driverOwnerStatusOptions} placeholder="Not recorded" />
        </div>
      </div>
    </FormModal>
  );
}