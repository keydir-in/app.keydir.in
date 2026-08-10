'use client';

/**
 * Sound test card: a custom lightweight audio player (no native <audio>
 * UI) plus a minimal stacked breakdown of the build. Empty fields are
 * hidden. Audio is preload="none" — nothing loads until play is pressed.
 */

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { SoundTestItem } from '@/types';
import { ReportModal } from '@/components/report/report-button';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface RowProps {
  label: string;
  value: string | null;
}

function Row({ label, value }: RowProps) {
  if (!value) return null;
  return (
    <div className="st-row">
      <span className="st-row-label">{label}</span>
      <span className="st-row-value">{value}</span>
    </div>
  );
}

interface SoundTestCardProps {
  test: SoundTestItem;
  productId: string;
  productSlug: string;
  canDelete: boolean;
  onDelete: () => void;
}

export function SoundTestCard({ test, productId, productSlug, canDelete, onDelete }: SoundTestCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastOk, setToastOk] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(text: string, ok = false) {
    setToast(text);
    setToastOk(ok);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  async function handleCopyLink() {
    setMenuOpen(false);
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      await navigator.clipboard.writeText(`${base}/products/${productSlug}?soundTest=${test.id}`);
      showToast('Link copied', true);
    } catch {
      showToast('Copy failed');
    }
  }

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(test.duration);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setIsPlaying(false));
    }
  }

  const keycaps = [test.keycapsName, test.keycapsMaterial && `(${test.keycapsMaterial}${test.keycapsProfile ? `, ${test.keycapsProfile}` : ''})`]
    .filter(Boolean)
    .join(' ');
  const switches = test.switchName ? `${test.switchName}${test.isLubed ? ' (Lubed)' : ''}${test.isFilmed ? ' (Filmed)' : ''}` : null;
  const mods = [test.foamUsed, test.otherMods, test.additionalMods].filter(Boolean).join('; ');

  return (
    <div className="st-card">
      <audio
        ref={audioRef}
        src={test.audioUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrent(0);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
      />

      <div className="st-card-player">
        <button type="button" className={`st-play-btn${isPlaying ? ' playing' : ''}`} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1.5" y="1.5" width="3" height="9" /><rect x="7.5" y="1.5" width="3" height="9" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.5v9l7.5-4.5L3 1.5z" /></svg>
          )}
        </button>

        <input
          className="st-progress"
          type="range"
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = Number(e.target.value);
            setCurrent(Number(e.target.value));
          }}
          aria-label="Seek"
        />

        <span className="st-duration">{formatTime(isPlaying || current > 0 ? current : duration)}</span>

        {canDelete && (
          <button
            type="button"
            className="st-delete-btn"
            onClick={onDelete}
            aria-label="Delete sound test"
            title="Delete sound test"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="st-card-body">
        <Row label="Keyboard" value={test.keyboardName} />
        <Row label="Plate" value={test.plate} />
        <Row label="PCB" value={test.pcbDetails} />
        <Row label="Switch" value={switches} />
        <Row label="Spring" value={test.springWeight} />
        <Row label="Keycaps" value={keycaps} />
        <Row label="Mods" value={mods} />
      </div>

      <div className="st-card-footer">
        <div className="st-card-user">— by @{test.username}</div>

        <div className="st-card-menu" ref={menuRef}>
          <button
            type="button"
            className="st-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Sound test options"
            title="Options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="st-menu-dropdown">
              <button type="button" className="st-menu-item" onClick={handleCopyLink}>
                Copy Link
              </button>
              <button
                type="button"
                className="st-menu-item st-menu-item-danger"
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportModal
          type="SOUND_TEST_ISSUE"
          productId={productId}
          soundTestId={test.id}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => showToast('Report submitted', true)}
        />
      )}

      {toast && (
        <div className="st-toast">
          {toastOk && <span className="st-toast-check">✓</span>} {toast}
        </div>
      )}
    </div>
  );
}
