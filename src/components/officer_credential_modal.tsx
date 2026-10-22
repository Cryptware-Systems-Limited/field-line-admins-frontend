import { Check, Clipboard } from 'lucide-react';

import type { CreateOfficerResponse } from '../types';

export function OfficerCredentialModal({ result, onClose }: { result: CreateOfficerResponse; onClose: () => void }) {
  const officer = result.officer;
  return (
    <div className="modal-backdrop">
      <section className="modal credential-modal">
        <div className="credential-success">
          <span className="round-icon">
            <Check />
          </span>
          <span className="eyebrow">Officer created</span>
          <h2>Mobile onboarding credentials</h2>
          <p>Give these details to {officer.personnelProfile.firstName} through an approved secure channel.</p>
          <div className="credential-box">
            <small>Service number</small>
            <strong>{officer.personnelProfile.personnelNumber}</strong>
            <small>Station-issued password</small>
            <code>{result.temporaryPassword}</code>
            <button className="button button--secondary" onClick={() => void navigator.clipboard.writeText(result.temporaryPassword)}>
              <Clipboard size={17} /> Copy password
            </button>
          </div>
          <div className="alert alert--warning">The password is shown only once. The officer will use it with their base station and device ID, then verify their phone and create a six-digit app PIN.</div>
          <button className="button button--primary button--wide" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}