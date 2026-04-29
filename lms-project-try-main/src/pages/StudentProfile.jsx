import React, { useState, useEffect } from 'react';
import styles from './StudentProfile.module.css';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function mapUserToForm(sourceUser) {
  return {
    firstName: sourceUser?.onboarding?.firstName || '',
    lastName: sourceUser?.onboarding?.lastName || '',
    email: sourceUser?.email || '',
    phone: sourceUser?.onboarding?.phone || '',
    bio: sourceUser?.profile?.bio || '',
    department: sourceUser?.onboarding?.department || '',
    collegeName: sourceUser?.onboarding?.collegeName || '',
    rollNo: sourceUser?.onboarding?.rollNo || '',
    yearOfStudy: sourceUser?.onboarding?.yearOfStudy || '',
  };
}

export default function StudentProfile() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    department: '',
    collegeName: '',
    rollNo: '',
    yearOfStudy: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const userId = localStorage.getItem('lmsUserId');
      if (!userId) {
        if (isMounted && user) {
          setForm(mapUserToForm(user));
          setIsBootstrapped(true);
        }
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

        if (isMounted) {
          setForm(mapUserToForm(backendUser));
          setAvatarPreview(backendUser.avatarUrl || '');
          setIsBootstrapped(true);
        }
      } catch {
        if (isMounted && user) {
          setForm(mapUserToForm(user));
          setAvatarPreview(user.avatarUrl || '');
          setIsBootstrapped(true);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isBootstrapped) return;

    const userId = localStorage.getItem('lmsUserId');
    if (!userId) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            profile: {
              bio: form.bio,
            },
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
      } catch {
        // Keep the current UX unchanged if autosave fails.
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [form, isBootstrapped]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (!user || !isBootstrapped) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* HEADER */}
        <div className={styles.header}>
          <h1>My Profile</h1>
          <p>Manage your account information</p>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'personal' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>

            <button
              className={`${styles.tab} ${activeTab === 'academic' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Information
            </button>
          </div>
        </div>

        {/* PERSONAL TAB */}
        {activeTab === 'personal' && (
          <>
            {/* PROFILE PIC */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Your Profile Picture</label>

              <div className={styles.avatarContainer}>
                <div className={styles.avatarBox}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.placeholderAvatar}>👤</div>
                  )}
                </div>

                <div className={styles.uploadInfo}>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadText}>📤 Upload your photo</span>
                    <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                  </label>
                  <p className={styles.uploadHint}>JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* PERSONAL INFO */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Personal Information</label>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <input className={styles.input} name="firstName" value={form.firstName} onChange={onChange} />
                </div>

                <div className={styles.field}>
                  <label>Last Name</label>
                  <input className={styles.input} name="lastName" value={form.lastName} onChange={onChange} />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Email</label>
                  <input className={styles.input} value={form.email} readOnly />
                </div>

                <div className={styles.field}>
                  <label>Phone</label>
                  <input className={styles.input} name="phone" value={form.phone} onChange={onChange} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Bio</label>
                <textarea className={styles.textarea} name="bio" value={form.bio} onChange={onChange} />
              </div>
            </div>
          </>
        )}

        {/* ACADEMIC TAB */}
        {activeTab === 'academic' && (
          <>
            {/* PROFILE PIC */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Your Profile Picture</label>

              <div className={styles.avatarContainer}>
                <div className={styles.avatarBox}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.placeholderAvatar}>👤</div>
                  )}
                </div>

                <div className={styles.uploadInfo}>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadText}>📤 Upload your photo</span>
                    <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
            </div>

            {/* ACADEMIC INFO */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Academic Information</label>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Department</label>
                  <input className={styles.input} name="department" value={form.department} onChange={onChange} />
                </div>

                <div className={styles.field}>
                  <label>Year</label>
                  <select className={styles.select} name="yearOfStudy" value={form.yearOfStudy} onChange={onChange}>
                    <option value="">Select</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>College</label>
                  <input className={styles.input} name="collegeName" value={form.collegeName} onChange={onChange} />
                </div>

                <div className={styles.field}>
                  <label>Roll No</label>
                  <input className={styles.input} name="rollNo" value={form.rollNo} onChange={onChange} />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}