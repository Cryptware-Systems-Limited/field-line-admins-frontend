import { Check, Clipboard } from 'lucide-react';

import type { CreatedOfficer } from '../components/create_officer_modal';

export function OfficerCredentialModal({ created, onClose }: { created: CreatedOfficer; onClose: () => void }) {
  const isField = created.kind === 'FIELD';
  const temporaryPassword = created.result.temporaryPassword;
  const firstName = created.kind === 'FIELD' ? created.result.officer.personnelProfile.firstName : created.input.firstName;
  const identifier = created.kind === 'FIELD' ? created.result.officer.personnelProfile.personnelNumber : created.input.email;

  return (
    <div className="modal-backdrop">
      <section className="modal credential-modal">
        <div className="credential-success">
          <span className="round-icon">
            <Check />
          </span>
          <span className="eyebrow">{isField ? 'Field officer created' : 'Station officer created'}</span>
          <h2>{isField ? 'Mobile onboarding credentials' : 'Web portal credentials'}</h2>
          <p>Give these details to {firstName} through an approved secure channel.</p>
          <div className="credential-box">
            <small>{isField ? 'Service number' : 'Email'}</small>
            <strong>{identifier}</strong>
            <small>{isField ? 'Station-issued password' : 'One-time temporary password'}</small>
            {temporaryPassword ? (
              <>
                <code>{temporaryPassword}</code>
                <button className="button button--secondary" onClick={() => void navigator.clipboard.writeText(temporaryPassword)}>
                  <Clipboard size={17} /> Copy password
                </button>
              </>
            ) : (
              <span className="muted small-copy">No temporary password was returned by the server.</span>
            )}
          </div>
          <div className="alert alert--warning">
            {isField
              ? 'The password is shown only once. The officer will use it with their base station and device ID, then verify their phone and create a six-digit app PIN.'
              : 'The password is shown only once. The officer will use it with their email to sign in to the Field-Line web portal.'}
          </div>
          <button className="button button--primary button--wide" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}