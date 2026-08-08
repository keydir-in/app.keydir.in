'use client';

/**
 * User contribution/activity card displaying contribution type, title,
 * description, XP awarded, approval status, and date. Supports an
 * optional delete action for the owning user.
 * Exports: ContributionCard (default)
 */

import { formatDateShort } from '@/lib/utils';

type Props = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  xpAwarded: number;
  status: string;
  createdAt: string;
  approvedBy: string | null;
  onDelete?: (id: string) => void;
  disabled?: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  ADD_PRODUCT: 'Product Added',
  UPDATE_PRICE: 'Price Update',
  EDIT_SPECS: 'Spec Fix',
  REPORT_VENDOR: 'Vendor Report',
  UPLOAD_IMAGES: 'Image Added',
  FIX_PRODUCT_INFO: 'Info Fix',
  ADD_VENDOR: 'Vendor Added',
  ADD_BRAND: 'Brand Added',
  DOCUMENTATION: 'Documentation',
  BUG_FIX: 'Bug Fix',
  FEATURE_DEV: 'Feature Dev',
  DB_CLEANUP: 'DB Cleanup',
  OTHER: 'Other',
};

export default function ContributionCard({
  id,
  type,
  title,
  description,
  xpAwarded,
  status,
  createdAt,
  onDelete,
  disabled,
}: Props) {
  const label = TYPE_LABELS[type] || type.replace(/_/g, ' ');
  const date = formatDateShort(new Date(createdAt));

  const lines = (description || '').split('\n');
  const descText = lines.filter(l => !l.startsWith('Ref:')).join('\n').trim();
  const refText = lines.find(l => l.startsWith('Ref:'));

  return (
    <div className="card-contribution">
      <div className="card-contribution-left">
        <div className="card-contribution-title-row">
          <span className="card-contribution-title">{title}</span>
        </div>
        <div className="card-contribution-meta-row">
          <span className="card-contribution-type">{label}</span>
          <span className={`card-contribution-status card-contribution-status--${status.toLowerCase()}`}>{status}</span>
        </div>
        {descText && (
          <div className="card-contribution-desc">{descText}</div>
        )}
        {refText && (
          <div className="card-contribution-ref">{refText}</div>
        )}
      </div>
      <div className="card-contribution-right">
        <span className="card-contribution-xp">+{xpAwarded} XP</span>
        <span className="card-contribution-date">{date}</span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(id)}
            disabled={disabled}
            className="card-contribution-delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
