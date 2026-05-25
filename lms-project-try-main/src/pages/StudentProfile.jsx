import React, { useState, useEffect, useCallback } from 'react';
import styles from './StudentProfile.module.css';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  collegeName: '',
  yearOfStudy: '',
  department: '',
  rollNo: '',
};

function mapUserToForm(sourceUser) {
  if (!sourceUser) return { ...EMPTY_FORM };
  const o = sourceUser.onboarding || {};
  return {
    firstName: o.firstName || sourceUser.first_name || '',
    lastName: o.lastName || sourceUser.last_name || '',
    email: sourceUser.email || '',
    phone: o.phone || sourceUser.phone || '',
    collegeName: o.collegeName || sourceUser.college_name || '',
    yearOfStudy: o.yearOfStudy || sourceUser.year_of_study || '',
    department: o.department || sourceUser.department || '',
    rollNo: o.rollNo || sourceUser.roll_no || '',
  };
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadProfile = useCallback(async () => {
    const userId = localStorage.getItem('lmsUserId');
    if (!userId) {
      if (user) {
        setForm(mapUserToForm(user));
        setAvatarPreview(user.avatarUrl || '');
      }
      setIsBootstrapped(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'x-user-id': userId },
      });
      const payload = await response.json().catch(() => ({}));
      const backendUser = payload?.data;

      if (!response.ok || !backendUser) {
        throw new Error(payload?.message || 'Failed to load profile');
      }

      setForm(mapUserToForm(backendUser));
      setAvatarPreview(backendUser.avatar_url || backendUser.avatarUrl || '');
    } catch {
      if (user) {
        setForm(mapUserToForm(user));
        setAvatarPreview(user.avatarUrl || '');
      }
    } finally {
      setIsBootstrapped(true);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setSaveMsg('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveMsg('Image must be 5MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setAvatarPreview('');
  };

  const handleSave = async () => {
    const userId = localStorage.getItem('lmsUserId');
    if (!userId) {
      setSaveMsg('Sign in to save your profile.');
      return;
    }

    setSaving(true);
    setSaveMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          onboarding: {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            department: form.department,
            yearOfStudy: form.yearOfStudy,
            collegeName: form.collegeName,
            rollNo: form.rollNo,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to save profile');
      if (payload?.data) setForm(mapUserToForm(payload.data));
      setSaveMsg('Changes saved.');
    } catch (err) {
      setSaveMsg(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isBootstrapped) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.cardHead}>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>Manage your account information</p>
          <p className={styles.sectionLabel}>Personal Information</p>
        </header>

        <div className={styles.cardBody}>
          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="4" stroke="#94a3b8" strokeWidth="1.5" />
                    <path
                      d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
              <label className={styles.avatarCamBtn} aria-label="Upload photo">
                <CameraIcon />
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarChange} />
              </label>
            </div>
            <div className={styles.avatarActions}>
              <label className={styles.btnPrimary}>
                Upload New
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarChange} />
              </label>
              <button type="button" className={styles.btnGhost} onClick={handleDeleteAvatar}>
                Delete avatar
              </button>
              <p className={styles.avatarHint}>JPG, PNG (max 5MB)</p>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>
                First Name <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.input}
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                placeholder="First name"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Last Name <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.input}
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                placeholder="Last name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={`${styles.input} ${styles.inputReadonly}`} value={form.email} readOnly />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mobile Number</label>
              <div className={styles.phoneWrap}>
                <span className={styles.phonePrefix} aria-hidden>
                  +234
                </span>
                <input
                  className={`${styles.input} ${styles.inputPhone}`}
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="0806 123 7890"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>College Name</label>
              <input
                className={styles.input}
                name="collegeName"
                value={form.collegeName}
                onChange={onChange}
                placeholder="College name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Year of Study</label>
              <select className={styles.input} name="yearOfStudy" value={form.yearOfStudy} onChange={onChange}>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input
                className={styles.input}
                name="department"
                value={form.department}
                onChange={onChange}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Roll No</label>
              <input
                className={styles.input}
                name="rollNo"
                value={form.rollNo}
                onChange={onChange}
                placeholder="Roll number"
              />
            </div>
          </div>
        </div>

        <footer className={styles.cardFoot}>
          {saveMsg ? (
            <p className={saveMsg.includes('saved') ? styles.saveOk : styles.saveErr} role="status">
              {saveMsg}
            </p>
          ) : null}
          <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
