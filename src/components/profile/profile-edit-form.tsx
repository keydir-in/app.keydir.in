'use client';

/**
 * Profile editing form for display name, bio, and social links (GitHub,
 * Reddit, Discord, Monkeytype, website). Includes field validation with
 * prefix stripping and pattern matching per provider.
 * Exports: ProfileEditForm
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/profile/actions';

interface ProfileEditFormProps {
  profile: {
    displayName: string | null;
    bio: string | null;
    github: string | null;
    discord: string | null;
    reddit: string | null;
    monkeytype: string | null;
    website: string | null;
  };
}

const PREFIXES = {
  github: 'https://github.com/',
  reddit: 'https://www.reddit.com/u/',
  discord: 'https://discord.com/users/',
  monkeytype: 'https://monkeytype.com/profile/',
} as const;

const PATTERNS = {
  github: /^[A-Za-z0-9-]+$/,
  reddit: /^[A-Za-z0-9_-]+$/,
  discord: /^[0-9]{17,20}$/,
  monkeytype: /^[A-Za-z0-9_-]+$/,
} as const;

const PLACEHOLDERS = {
  github: 'username',
  reddit: 'username',
  discord: 'User ID (17-20 digits)',
  monkeytype: 'username',
} as const;

type SocialKey = keyof typeof PREFIXES;

function stripPrefix(url: string | null, prefix: string): string {
  if (!url) return '';
  return url.startsWith(prefix) ? url.slice(prefix.length) : url;
}

function validateField(key: SocialKey, value: string): string {
  if (!value) return '';
  if (!PATTERNS[key].test(value)) {
    switch (key) {
      case 'github': return 'Letters, numbers, and hyphens only';
      case 'reddit': return 'Letters, numbers, underscores, and hyphens only';
      case 'discord': return 'Must be 17-20 digits';
      case 'monkeytype': return 'Letters, numbers, underscores, and hyphens only';
    }
  }
  return '';
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<SocialKey, string>>({
    github: stripPrefix(profile.github, PREFIXES.github),
    reddit: stripPrefix(profile.reddit, PREFIXES.reddit),
    discord: stripPrefix(profile.discord, PREFIXES.discord),
    monkeytype: stripPrefix(profile.monkeytype, PREFIXES.monkeytype),
  });
  const router = useRouter();

  function handleChange(key: SocialKey, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, val) }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    for (const key of Object.keys(PATTERNS) as SocialKey[]) {
      newErrors[key] = validateField(key, values[key]);
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    for (const key of Object.keys(PREFIXES) as SocialKey[]) {
      const val = fd.get(key) as string;
      fd.set(key, val ? PREFIXES[key] + val : '');
    }

    setSaving(true);
    await updateProfile(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="profile-edit-form">
      <div className="profile-edit-grid">
        <div className="admin-field">
          <label className="admin-label">Display Name</label>
          <input
            name="displayName"
            defaultValue={profile.displayName ?? ''}
            className="admin-input"
            maxLength={50}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            className="admin-input"
            maxLength={200}
            placeholder="Tell us about yourself"
            rows={3}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">GitHub</label>
          <div className="profile-prefix-input">
            <span className="profile-prefix">{PREFIXES.github}</span>
            <input
              name="github"
              className="admin-input profile-prefix-field"
              placeholder={PLACEHOLDERS.github}
              value={values.github}
              onChange={(e) => handleChange('github', e.target.value)}
            />
          </div>
          {errors.github && <span className="profile-field-error">{errors.github}</span>}
        </div>
        <div className="admin-field">
          <label className="admin-label">Reddit</label>
          <div className="profile-prefix-input">
            <span className="profile-prefix">{PREFIXES.reddit}</span>
            <input
              name="reddit"
              className="admin-input profile-prefix-field"
              placeholder={PLACEHOLDERS.reddit}
              value={values.reddit}
              onChange={(e) => handleChange('reddit', e.target.value)}
            />
          </div>
          {errors.reddit && <span className="profile-field-error">{errors.reddit}</span>}
        </div>
        <div className="admin-field">
          <label className="admin-label">Discord</label>
          <div className="profile-prefix-input">
            <span className="profile-prefix">{PREFIXES.discord}</span>
            <input
              name="discord"
              className="admin-input profile-prefix-field"
              placeholder={PLACEHOLDERS.discord}
              value={values.discord}
              onChange={(e) => handleChange('discord', e.target.value)}
            />
          </div>
          {errors.discord && <span className="profile-field-error">{errors.discord}</span>}
        </div>
        <div className="admin-field">
          <label className="admin-label">Monkeytype</label>
          <div className="profile-prefix-input">
            <span className="profile-prefix">{PREFIXES.monkeytype}</span>
            <input
              name="monkeytype"
              className="admin-input profile-prefix-field"
              placeholder={PLACEHOLDERS.monkeytype}
              value={values.monkeytype}
              onChange={(e) => handleChange('monkeytype', e.target.value)}
            />
          </div>
          {errors.monkeytype && <span className="profile-field-error">{errors.monkeytype}</span>}
        </div>
        <div className="admin-field">
          <label className="admin-label">Website</label>
          <input
            name="website"
            type="url"
            defaultValue={profile.website ?? ''}
            className="admin-input"
            placeholder="https://example.com"
          />
        </div>
      </div>
      <div className="profile-edit-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => router.back()}>
          CANCEL
        </button>
      </div>
    </form>
  );
}
