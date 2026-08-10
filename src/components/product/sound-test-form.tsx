'use client';

/**
 * Sound test upload form overlay. Verified users only (the caller hides the
 * button otherwise). Validates required fields + audio type/size client-side,
 * then POSTs to /api/sound-tests.
 */

import { useRef, useState } from 'react';
import type { SoundTestItem, SwitchOption } from '@/types';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/x-pn-wav', 'audio/x-m4a', 'audio/mp4']);
const ALLOWED_EXTS = new Set(['mp3', 'wav', 'm4a']);

interface SoundTestFormProps {
  productId: string;
  productName: string;
  productType: string;
  switches: SwitchOption[];
  onClose: () => void;
  onCreated: (test: SoundTestItem) => void;
}

export function SoundTestForm({ productId, productName, productType, switches, onClose, onCreated }: SoundTestFormProps) {
  const isSwitchProduct = productType === 'switches';
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLubed, setIsLubed] = useState(false);
  const [isFilmed, setIsFilmed] = useState(false);

  const [fields, setFields] = useState({
    keyboardName: '',
    foamUsed: '',
    pcbDetails: '',
    plate: '',
    springWeight: '',
    otherMods: '',
    keycapsName: '',
    keycapsMaterial: '',
    keycapsProfile: '',
    additionalMods: '',
  });

  const [switchQuery, setSwitchQuery] = useState('');
  const [selectedSwitch, setSelectedSwitch] = useState<SwitchOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const matches = switchQuery.trim()
    ? switches.filter((s) => s.name.toLowerCase().includes(switchQuery.trim().toLowerCase())).slice(0, 8)
    : [];

  function handleFile(file: File | null) {
    setFileError(null);
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext ?? '')) {
      setFileError('Only MP3, WAV, M4A allowed');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError('Max file size is 2MB');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const file = fileRef.current?.files?.[0] ?? null;
    if (!file) {
      setError('Audio file is required');
      return;
    }
    const customSwitch = switchQuery.trim();
    if (!isSwitchProduct && !selectedSwitch && !customSwitch) {
      setError('Pick a switch or enter a switch name');
      return;
    }
    if (isSwitchProduct && !fields.keyboardName.trim()) {
      setError('Keyboard name is required');
      return;
    }
    if (fileError) {
      setError(fileError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('productId', productId);
    formData.append('isLubed', String(isLubed));
    formData.append('isFilmed', String(isFilmed));
    if (isSwitchProduct) {
      formData.append('switchId', productId);
    } else if (selectedSwitch) {
      formData.append('switchId', selectedSwitch.id);
    } else {
      formData.append('switchName', customSwitch);
    }
    for (const [k, v] of Object.entries(fields)) formData.append(k, v);

    try {
      const res = await fetch('/api/sound-tests', { method: 'POST', body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Upload failed');
        return;
      }
      onCreated(body as SoundTestItem);
      onClose();
    } catch {
      setError('Upload failed — check your connection');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="st-overlay" onClick={onClose}>
      <div className="st-form" onClick={(e) => e.stopPropagation()}>
        <div className="st-form-head">
          <span className="st-form-title">+ ADD <em>SOUND TEST</em></span>
          <button type="button" className="st-form-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="st-form-field">
            <label className="admin-label" htmlFor="st-audio">Audio * (.mp3 / .wav / .m4a, max 2MB)</label>
            <input
              id="st-audio"
              ref={fileRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/*"
              className="admin-input"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              required
            />
            {fileError && <div className="st-form-error">{fileError}</div>}
          </div>

          <div className="st-form-group">
            <div className="st-form-group-label">KEYBOARD</div>
            <div className="st-form-field">
              <label className="admin-label" htmlFor="st-kb">Keyboard Name {isSwitchProduct ? '*' : ''}</label>
              {isSwitchProduct ? (
                <input id="st-kb" className="admin-input" value={fields.keyboardName} onChange={(e) => set('keyboardName', e.target.value)} placeholder="e.g. QK75" required />
              ) : (
                <input id="st-kb" className="admin-input" value={productName} disabled title="This product" />
              )}
            </div>
            <div className="st-form-grid">
              <div className="st-form-field">
                <label className="admin-label" htmlFor="st-foam">Foam Used</label>
                <input id="st-foam" className="admin-input" value={fields.foamUsed} onChange={(e) => set('foamUsed', e.target.value)} placeholder="e.g. PE foam, case foam" />
              </div>
              <div className="st-form-field">
                <label className="admin-label" htmlFor="st-plate">Plate</label>
                <input id="st-plate" className="admin-input" value={fields.plate} onChange={(e) => set('plate', e.target.value)} placeholder="e.g. FR4, PC" />
              </div>
            </div>
            <div className="st-form-field">
              <label className="admin-label" htmlFor="st-pcb">PCB Details</label>
              <input id="st-pcb" className="admin-input" value={fields.pcbDetails} onChange={(e) => set('pcbDetails', e.target.value)} placeholder="e.g. Hotswap, flex-cut" />
            </div>
          </div>

          <div className="st-form-group">
            <div className="st-form-group-label">SWITCH</div>
            <div className="st-form-field st-switch-field">
              <label className="admin-label" htmlFor="st-sw">Switch *</label>
              {isSwitchProduct ? (
                <input id="st-sw" className="admin-input" value={productName} disabled title="This switch" />
              ) : (
                <>
                  <input
                    id="st-sw"
                    className="admin-input"
                    value={selectedSwitch ? selectedSwitch.name : switchQuery}
                    placeholder="Search or type a switch name"
                    autoComplete="off"
                    onChange={(e) => {
                      setSelectedSwitch(null);
                      setSwitchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  />
                  {showDropdown && switchQuery.trim() && (
                    <div className="st-switch-dropdown">
                      {matches.length === 0 ? (
                        <div className="st-switch-empty">No match — &quot;{switchQuery}&quot; will be added as a custom switch</div>
                      ) : (
                        matches.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="st-switch-option"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedSwitch(s);
                              setSwitchQuery('');
                              setShowDropdown(false);
                            }}
                          >
                            {s.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="st-form-grid st-form-grid-3">
              <div className="st-form-field">
                <label className="admin-label" htmlFor="st-spring">Spring Weight</label>
                <input id="st-spring" className="admin-input" value={fields.springWeight} onChange={(e) => set('springWeight', e.target.value)} placeholder="e.g. 62g" />
              </div>
              <div className="st-form-field">
                <span className="admin-label">Lubed</span>
                <button
                  type="button"
                  className={`st-toggle${isLubed ? ' on' : ''}`}
                  role="switch"
                  aria-checked={isLubed}
                  onClick={() => setIsLubed((v) => !v)}
                >
                  {isLubed ? 'YES' : 'NO'}
                </button>
              </div>
              <div className="st-form-field">
                <span className="admin-label">Switch Film</span>
                <button
                  type="button"
                  className={`st-toggle${isFilmed ? ' on' : ''}`}
                  role="switch"
                  aria-checked={isFilmed}
                  onClick={() => setIsFilmed((v) => !v)}
                >
                  {isFilmed ? 'YES' : 'NO'}
                </button>
              </div>
            </div>
            <div className="st-form-field">
              <label className="admin-label" htmlFor="st-other-mods">Other Mods</label>
              <input id="st-other-mods" className="admin-input" value={fields.otherMods} onChange={(e) => set('otherMods', e.target.value)} placeholder="e.g. Switch films, 205g0, donut mod" />
            </div>
          </div>

          <div className="st-form-group">
            <div className="st-form-group-label">KEYCAPS</div>
            <div className="st-form-field">
              <label className="admin-label" htmlFor="st-kc-name">Keycaps Name</label>
              <input id="st-kc-name" className="admin-input" value={fields.keycapsName} onChange={(e) => set('keycapsName', e.target.value)} placeholder="e.g. GMK Olivia" />
            </div>
            <div className="st-form-grid">
              <div className="st-form-field">
                <label className="admin-label" htmlFor="st-kc-mat">Material</label>
                <input id="st-kc-mat" className="admin-input" value={fields.keycapsMaterial} onChange={(e) => set('keycapsMaterial', e.target.value)} placeholder="e.g. ABS, PBT" />
              </div>
              <div className="st-form-field">
                <label className="admin-label" htmlFor="st-kc-pro">Profile</label>
                <input id="st-kc-pro" className="admin-input" value={fields.keycapsProfile} onChange={(e) => set('keycapsProfile', e.target.value)} placeholder="e.g. Cherry, SA" />
              </div>
            </div>
          </div>

          <div className="st-form-group">
            <div className="st-form-group-label">EXTRA</div>
            <div className="st-form-field">
              <label className="admin-label" htmlFor="st-add">Additional Mods</label>
              <textarea id="st-add" className="admin-input" rows={3} value={fields.additionalMods} onChange={(e) => set('additionalMods', e.target.value)} placeholder="Anything else worth sharing" />
            </div>
          </div>

          {error && <div className="st-form-error">{error}</div>}

          <div className="st-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Submit Sound Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
