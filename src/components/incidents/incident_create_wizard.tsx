import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Crosshair, LoaderCircle, Plus, Trash2 } from 'lucide-react';

import { api } from '../../api';
import type { UpdateIncidentInput, UpsertIncidentPersonInput, UpsertIncidentVehicleInput } from '../../types';
import { getError } from '../../utils/errors';
import {
  driverOwnerStatusOptions,
  fromDateTimeLocal,
  humanize,
  incidentTypeOptions,
  newId,
  personRoleOptions,
  priorityOptions,
  toDateTimeLocal,
  vehicleRoleOptions,
  vehicleTypeOptions,
} from '../../utils/incident_options';
import { SelectField, TextAreaField, TextField } from '../form_fields';
import { ModalHeader } from '../modal_header';

type PersonDraft = UpsertIncidentPersonInput & { id: string };
type VehicleDraft = UpsertIncidentVehicleInput & { id: string };

type Props = {
  token: string;
  onClose: () => void;
  onCreated: (incidentId: string) => void;
};

const steps = ['Incident', 'Location', 'People & vehicles', 'Review'];

function emptyPerson(): PersonDraft {
  return { id: newId(), role: 'VICTIM', fullName: '' };
}

function emptyVehicle(): VehicleDraft {
  return {
    id: newId(),
    type: 'CAR',
    role: 'INVOLVED',
    driverOwnerStatus: 'UNKNOWN',
  };
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== '' && entry !== undefined),
  ) as T;
}

export function IncidentCreateWizard({ token, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [incident] = useState(() => ({ id: newId(), clientCreatedAt: new Date().toISOString() }));
  const [form, setForm] = useState({
    type: '',
    otherTypeDescription: '',
    priority: 'ROUTINE',
    occurredAt: toDateTimeLocal(new Date().toISOString()),
    description: '',
    latitude: '',
    longitude: '',
    accuracyMeters: '',
    resolvedAddress: '',
    landmarkOrDirections: '',
  });
  const [people, setPeople] = useState<PersonDraft[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>([]);
  const [person, setPerson] = useState<PersonDraft>(emptyPerson);
  const [vehicle, setVehicle] = useState<VehicleDraft>(emptyVehicle);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setPersonField = (key: keyof PersonDraft) => (value: string) =>
    setPerson((current) => ({ ...current, [key]: value }));
  const setVehicleField = (key: keyof VehicleDraft) => (value: string) =>
    setVehicle((current) => ({ ...current, [key]: value }));

  function addPerson() {
    if (person.fullName.trim().length < 2) {
      setError('Enter the person’s full name before adding them.');
      return;
    }
    setPeople((current) => [...current, clean({ ...person, fullName: person.fullName.trim() })]);
    setPerson(emptyPerson());
    setError('');
  }

  function addVehicle() {
    setVehicles((current) => [...current, clean(vehicle)]);
    setVehicle(emptyVehicle());
    setError('');
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser. Enter the coordinates manually.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
          accuracyMeters: Math.round(coords.accuracy).toString(),
        }));
        setLocating(false);
      },
      () => {
        setError('Location could not be captured. Allow browser location access or enter it manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!form.type || !form.priority || !form.occurredAt || form.description.trim().length < 3) {
        return 'Complete the incident type, priority, date/time, and description.';
      }
      if (form.type === 'OTHER' && form.otherTypeDescription.trim().length < 3) {
        return 'Describe the custom incident type.';
      }
    }
    if (step === 1) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Enter a valid latitude between -90 and 90.';
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Enter a valid longitude between -180 and 180.';
    }
    return '';
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < steps.length - 1) {
      setError('');
      setStep((current) => current + 1);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      const accuracyMeters = Number(form.accuracyMeters);
      const input: UpdateIncidentInput = {
        type: form.type,
        ...(form.type === 'OTHER'
          ? { otherTypeDescription: form.otherTypeDescription.trim() }
          : {}),
        priority: form.priority,
        occurredAt: fromDateTimeLocal(form.occurredAt),
        clientCreatedAt: incident.clientCreatedAt,
        description: form.description.trim(),
        location: {
          latitude,
          longitude,
          ...(Number.isFinite(accuracyMeters) && accuracyMeters >= 0 ? { accuracyMeters } : {}),
          capturedAt: new Date().toISOString(),
          ...(form.resolvedAddress.trim() ? { resolvedAddress: form.resolvedAddress.trim() } : {}),
          ...(form.landmarkOrDirections.trim()
            ? { landmarkOrDirections: form.landmarkOrDirections.trim() }
            : {}),
          source: 'MANUAL',
        },
      };

      await api.upsertIncident(token, incident.id, input);
      for (const entry of people) {
        const { id, ...body } = entry;
        await api.upsertIncidentPerson(token, incident.id, id, clean(body));
      }
      for (const entry of vehicles) {
        const { id, ...body } = entry;
        await api.upsertIncidentVehicle(token, incident.id, id, clean(body));
      }
      onCreated(incident.id);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal incident-wizard">
        <ModalHeader eyebrow="Station incident desk" title="Create incident" onClose={onClose} />
        <div className="wizard-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((label, index) => (
            <div key={label} className={index <= step ? 'wizard-step wizard-step--active' : 'wizard-step'}>
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        <form onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}

          {step === 0 && (
            <div className="form-section">
              <h3>What happened?</h3>
              <p className="muted small-copy">Classify the report and record the initial account.</p>
              <div className="form-grid">
                <SelectField label="Incident type" value={form.type} onChange={set('type')} options={incidentTypeOptions} placeholder="Select type" required />
                <SelectField label="Priority" value={form.priority} onChange={set('priority')} options={priorityOptions} required />
                {form.type === 'OTHER' && (
                  <TextField className="span-2" label="Custom incident type" value={form.otherTypeDescription} onChange={set('otherTypeDescription')} minLength={3} maxLength={120} placeholder="Describe what is being reported" required />
                )}
                <TextField className="span-2" type="datetime-local" label="Date and time of incident" value={form.occurredAt} onChange={set('occurredAt')} required />
                <TextAreaField className="span-2" label="Description" value={form.description} onChange={set('description')} rows={6} placeholder="Record the complainant’s account and the known facts." required />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-section">
              <div className="section-heading-row">
                <div>
                  <h3>Where did it happen?</h3>
                  <p className="muted small-copy">Capture the incident location, not necessarily the station desk location.</p>
                </div>
                <button type="button" className="button button--secondary" onClick={useCurrentLocation} disabled={locating}>
                  {locating ? <LoaderCircle className="spin" size={17} /> : <Crosshair size={17} />}
                  Use current location
                </button>
              </div>
              <div className="form-grid">
                <TextField label="Latitude" inputMode="decimal" value={form.latitude} onChange={set('latitude')} placeholder="6.601820" required />
                <TextField label="Longitude" inputMode="decimal" value={form.longitude} onChange={set('longitude')} placeholder="3.351510" required />
                <TextField label="Accuracy in metres (optional)" inputMode="decimal" value={form.accuracyMeters} onChange={set('accuracyMeters')} placeholder="8" />
                <span />
                <TextField className="span-2" label="Address" value={form.resolvedAddress} onChange={set('resolvedAddress')} maxLength={500} placeholder="Street, area, city" />
                <TextField className="span-2" label="Landmark or directions" value={form.landmarkOrDirections} onChange={set('landmarkOrDirections')} maxLength={500} placeholder="Opposite the filling station" />
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="form-section">
                <h3>People involved</h3>
                <p className="muted small-copy">Optional. Add victims, witnesses, suspects, or informants now; more can be added later.</p>
                {people.length > 0 && (
                  <div className="draft-list">
                    {people.map((entry) => (
                      <div key={entry.id}>
                        <span><strong>{entry.fullName}</strong><small>{humanize(entry.role)}</small></span>
                        <button type="button" className="icon-button icon-button--danger" onClick={() => setPeople((current) => current.filter((item) => item.id !== entry.id))} aria-label={`Remove ${entry.fullName}`}><Trash2 size={17} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-grid compact-grid">
                  <SelectField label="Role" value={person.role} onChange={setPersonField('role')} options={personRoleOptions} required />
                  <TextField label="Full name" value={person.fullName} onChange={setPersonField('fullName')} placeholder="Full legal name" />
                  <TextField label="Phone (optional)" value={person.phone ?? ''} onChange={setPersonField('phone')} placeholder="080…" />
                  <TextField label="Address (optional)" value={person.address ?? ''} onChange={setPersonField('address')} />
                </div>
                <button type="button" className="button button--secondary add-draft-button" onClick={addPerson}><Plus size={17} /> Add person</button>
              </div>

              <div className="form-section">
                <h3>Vehicles involved</h3>
                <p className="muted small-copy">Optional. Add any vehicle connected to the incident.</p>
                {vehicles.length > 0 && (
                  <div className="draft-list">
                    {vehicles.map((entry) => (
                      <div key={entry.id}>
                        <span><strong>{entry.plateNumber || humanize(entry.type)}</strong><small>{humanize(entry.role)}</small></span>
                        <button type="button" className="icon-button icon-button--danger" onClick={() => setVehicles((current) => current.filter((item) => item.id !== entry.id))} aria-label="Remove vehicle"><Trash2 size={17} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-grid compact-grid">
                  <SelectField label="Vehicle type" value={vehicle.type} onChange={setVehicleField('type')} options={vehicleTypeOptions} required />
                  <TextField label="Plate number (optional)" value={vehicle.plateNumber ?? ''} onChange={setVehicleField('plateNumber')} placeholder="KTU 482 QA" />
                  <TextField label="Make / model (optional)" value={vehicle.makeModel ?? ''} onChange={setVehicleField('makeModel')} placeholder="Toyota Corolla" />
                  <TextField label="Colour (optional)" value={vehicle.colour ?? ''} onChange={setVehicleField('colour')} />
                  <SelectField label="Role in incident" value={vehicle.role} onChange={setVehicleField('role')} options={vehicleRoleOptions} required />
                  <SelectField label="Driver / owner status" value={vehicle.driverOwnerStatus ?? 'UNKNOWN'} onChange={setVehicleField('driverOwnerStatus')} options={driverOwnerStatusOptions} required />
                </div>
                <button type="button" className="button button--secondary add-draft-button" onClick={addVehicle}><Plus size={17} /> Add vehicle</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="form-section review-section">
              <h3>Review before saving</h3>
              <p className="muted small-copy">Saving opens a case automatically and creates the official station reference.</p>
              <dl className="review-list">
                <div><dt>Type</dt><dd>{form.type === 'OTHER' ? form.otherTypeDescription : humanize(form.type)}</dd></div>
                <div><dt>Priority</dt><dd>{humanize(form.priority)}</dd></div>
                <div><dt>Occurred</dt><dd>{new Date(fromDateTimeLocal(form.occurredAt)).toLocaleString('en-NG')}</dd></div>
                <div><dt>Location</dt><dd>{form.resolvedAddress || `${form.latitude}, ${form.longitude}`}</dd></div>
                <div><dt>Description</dt><dd>{form.description}</dd></div>
                <div><dt>People</dt><dd>{people.length || 'None added'}</dd></div>
                <div><dt>Vehicles</dt><dd>{vehicles.length || 'None added'}</dd></div>
              </dl>
            </div>
          )}

          <footer>
            <button type="button" className="button button--ghost" onClick={step === 0 ? onClose : () => { setError(''); setStep((current) => current - 1); }} disabled={loading}>
              {step > 0 && <ArrowLeft size={17} />} {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button className="button button--primary" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : step === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
              {step === steps.length - 1 ? 'Save incident' : 'Continue'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
