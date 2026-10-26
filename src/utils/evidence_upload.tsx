import { api, ApiError } from '../api';
import type { EvidenceUploadTicket } from '../types';
import { compact } from './errors';

export function evidenceTypeForMime(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'PHOTO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

export async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

type CloudinaryUploadResult = {
  asset_id: string;
  public_id: string;
  version: number;
  signature: string;
  resource_type: string;
  type: string;
  bytes: number;
  format?: string;
  etag: string;
};
async function uploadToCloudinary(ticket: EvidenceUploadTicket, file: File) {
  const resourceType = ticket.resourceType || 'auto';
  const url = ticket.uploadUrl || (ticket.cloudName ? `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${resourceType}/upload` : '');
  if (!url) throw new ApiError('The server did not return an upload destination for this file.', 0);

  const signed = ticket.parameters ?? ticket.fields ?? ticket.params;
  const fields: Record<string, string | number | boolean | undefined> = signed
    ? { api_key: ticket.apiKey, signature: ticket.signature, ...signed }
    : {
        api_key: ticket.apiKey,
        timestamp: ticket.timestamp,
        signature: ticket.signature,
        public_id: ticket.publicId,
        folder: ticket.folder,
        type: ticket.deliveryType,
      };

  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== '') body.append(key, String(value));
  });
  body.append('file', file);

  const response = await fetch(url, { method: 'POST', body });
  const result = (await response.json().catch(() => null)) as (CloudinaryUploadResult & { error?: { message?: string } }) | null;
  if (!response.ok || !result) throw new ApiError(result?.error?.message || `File upload failed (${response.status})`, response.status);
  return result;
}

type UploadArgs = {
  token: string;
  incidentId: string;
  evidenceId: string;
  file: File;
  type: string;
  description?: string;
  capturedAt?: string;
  onStep: (step: string) => void;
};

/** upload-request → direct upload to Cloudinary → complete. */
export async function uploadEvidenceFile({ token, incidentId, evidenceId, file, type, description, capturedAt, onStep }: UploadArgs) {
  onStep('Fingerprinting file…');
  const sha256 = await sha256Hex(file);

  onStep('Requesting secure upload…');
  const ticket = await api.requestEvidenceUpload(
    token,
    incidentId,
    evidenceId,
    compact({
      type,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      sha256,
      capturedAt: capturedAt ?? '',
      description: description ?? '',
      originalFileName: file.name,
    }),
  );

  onStep('Uploading file…');
  const uploaded = await uploadToCloudinary(ticket, file);

  onStep('Finalising evidence record…');
  await api.completeEvidenceUpload(token, incidentId, evidenceId, {
    assetId: uploaded.asset_id,
    publicId: uploaded.public_id,
    version: uploaded.version,
    signature: uploaded.signature,
    resourceType: uploaded.resource_type,
    deliveryType: uploaded.type,
    bytes: uploaded.bytes,
    format: uploaded.format ?? '',
    etag: uploaded.etag,
  });
}