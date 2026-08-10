'use client';

/**
 * Reporting components:
 * - ReportButton: trigger + modal. Optional `instant` mode sends without a
 *   modal (used by the error page).
 * - ReportModal: controlled modal, so a 3-dot menu (or anything else) can
 *   open the report dialog without rendering its own trigger.
 * Both submit to POST /api/report and show a transient toast on success.
 */

import { useRef, useState } from 'react';

export type ReportTypeValue = 'PAGE_ISSUE' | 'PRODUCT_ISSUE' | 'SOUND_TEST_ISSUE';

export const SOUND_TEST_OTHER = 'Other';

const SOUND_TEST_OPTIONS = [
  { value: 'Bad sound quality', label: 'Bad sound quality' },
  { value: 'Inappropriate sound', label: 'Inappropriate sound' },
  { value: SOUND_TEST_OTHER, label: 'Other' },
];

const PRODUCT_REASONS = [
  { value: 'INCORRECT_SPECS', label: 'Incorrect specifications' },
  { value: 'MISSING_INFO', label: 'Missing information' },
  { value: 'WRONG_PRICING', label: 'Wrong pricing' },
  { value: 'DUPLICATE_PRODUCT', label: 'Duplicate product' },
  { value: 'BROKEN_LINKS', label: 'Broken links / vendors not working' },
  { value: 'OTHER', label: 'Other' },
];

interface ReportButtonProps {
  type: ReportTypeValue;
  productId?: string;
  soundTestId?: string;
  message?: string;
  instant?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ReportButton({ type, productId, soundTestId, message, instant, className, children }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastOk, setToastOk] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(text: string, ok = false) {
    setToast(text);
    setToastOk(ok);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  async function handleInstant() {
    const result = await submitReport({
      type,
      product_id: productId ?? null,
      sound_test_id: soundTestId ?? null,
      page_url: window.location.href,
      message: message ?? 'Unhandled runtime error',
    });
    if (result === null) showToast('Report submitted', true);
    else showToast(result);
  }

  return (
    <>
      {instant ? (
        <button type="button" className={className} onClick={handleInstant}>
          {children}
        </button>
      ) : (
        <button type="button" className={className} onClick={() => setOpen(true)}>
          {children}
        </button>
      )}

      {!instant && open && (
        <ReportModal
          type={type}
          productId={productId}
          soundTestId={soundTestId}
          onClose={() => setOpen(false)}
          onSubmitted={() => showToast('Report submitted', true)}
        />
      )}

      {toast && <Toast text={toast} ok={toastOk} />}
    </>
  );
}

interface ReportModalProps {
  type: ReportTypeValue;
  productId?: string;
  soundTestId?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ReportModal({ productId, soundTestId, onClose, onSubmitted }: ReportModalProps) {
  const [message, setMessage] = useState('');
  const [option, setOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSoundTest = Boolean(soundTestId);
  const isProduct = !isSoundTest && Boolean(productId);
  const otherValue = isSoundTest ? SOUND_TEST_OTHER : 'OTHER';
  const hasOptions = isSoundTest || isProduct;
  const showTextarea = !hasOptions || option === otherValue;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    let payload: Record<string, unknown>;
    if (isSoundTest) {
      if (!option) {
        setError('Please select an option');
        return;
      }
      const m = option === SOUND_TEST_OTHER ? message.trim() : option;
      if (!m) {
        setError('Message is required');
        return;
      }
      payload = { type: 'SOUND_TEST_ISSUE', sound_test_id: soundTestId, message: m };
    } else if (isProduct) {
      if (!option) {
        setError('Please select an option');
        return;
      }
      const m = message.trim();
      if (option === 'OTHER' && !m) {
        setError('Message is required for this reason');
        return;
      }
      payload = { type: 'PRODUCT_ISSUE', product_id: productId, reason: option, message: m || null };
    } else {
      if (!message.trim()) {
        setError('Message is required');
        return;
      }
      payload = { type: 'PAGE_ISSUE', message: message.trim() };
    }

    setSubmitting(true);
    setError(null);
    const result = await submitReport({
      ...payload,
      page_url: window.location.href,
    });
    setSubmitting(false);
    if (result === null) {
      onSubmitted?.();
      onClose();
    } else {
      setError(result);
    }
  }

  const options = isSoundTest ? SOUND_TEST_OPTIONS : PRODUCT_REASONS;
  const optionLabel = isSoundTest ? "What's wrong with this sound test?" : 'What seems wrong with this product?';

  return (
    <div className="st-overlay" onClick={onClose}>
      <div className="st-form st-report" onClick={(e) => e.stopPropagation()}>
        <div className="st-form-head">
          <span className="st-form-title">
            REPORT <em>ISSUE</em>
          </span>
          <button type="button" className="st-form-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {hasOptions ? (
            <div className="st-form-field">
              <span className="admin-label">{optionLabel}</span>
              <div className="st-radio-group">
                {options.map((opt) => (
                  <label key={opt.value} className="st-radio">
                    <input
                      type="radio"
                      name="rpt-option"
                      checked={option === opt.value}
                      onChange={() => {
                        setOption(opt.value);
                        setMessage('');
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {showTextarea && (
            <div className="st-form-field">
              <label className="admin-label" htmlFor="rpt-msg">Message {hasOptions ? '' : '*'}</label>
              <textarea
                id="rpt-msg"
                className="admin-input"
                rows={4}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={hasOptions ? 'Describe the issue...' : 'What went wrong? Be specific so we can fix it.'}
                required={!hasOptions}
              />
            </div>
          )}

          {error && <div className="st-form-error">{error}</div>}

          <div className="st-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting || (hasOptions && !option)}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function submitReport(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json.error || 'Failed to submit report';
    return null;
  } catch {
    return 'Failed to submit report — check your connection';
  }
}

function Toast({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div className="st-toast">
      {ok && <span className="st-toast-check">✓</span>} {text}
    </div>
  );
}
