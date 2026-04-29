import React, { useState } from 'react';
import styles from './StudentOnboarding.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const STEPS = [
  { label: 'Personal information' },
  { label: 'Academic details'},
];

export default function StudentOnboarding() {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [tried,   setTried]   = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    department: '', yearOfStudy: '', collegeName: '', rollNo: '',
  });
  const [errs, setErrs] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errs[name]) setErrs(p => ({ ...p, [name]: '' }));
  };

  const v1 = () => {
    const e = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) e.firstName = 'Min 2 characters';
    if (!form.lastName.trim()  || form.lastName.trim().length  < 2) e.lastName  = 'Min 2 characters';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Exactly 10 digits required';
    setErrs(e); return !Object.keys(e).length;
  };

  const v2 = () => {
    const e = {};
    if (!form.department.trim()) e.department = 'Required';
    if (!form.yearOfStudy)       e.yearOfStudy = 'Required';
    if (!form.collegeName.trim() || form.collegeName.trim().length < 2) e.collegeName = 'Min 2 characters';
    if (!form.rollNo.trim()) e.rollNo = 'Required';
    setErrs(e); return !Object.keys(e).length;
  };

  const next = () => { if (v1()) { setStep(2); setError(''); setTried(false); } else setTried(true); };
  const back = () => { setStep(1); setError(''); setTried(false); setErrs({}); };

  const submit = async () => {
    if (!v2()) { setTried(true); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const userId = localStorage.getItem('lmsUserId');
      if (!userId) throw new Error('User ID not found. Please log in again.');
      const res = await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          phone: form.phone.trim(), department: form.department.trim(),
          yearOfStudy: form.yearOfStudy, collegeName: form.collegeName.trim(),
          rollNo: form.rollNo.trim(),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setSuccess('Profile saved! Redirecting…');
      setTimeout(() => {
        const role = String(localStorage.getItem('lmsUserRole') || 'student').toLowerCase();
        window.location.href = role === 'student' ? '/student/home' : '/dashboard';
      }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  const e = (k) => tried && errs[k];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2"  y="2"  width="6" height="6" rx="1.5" fill="currentColor"/>
              <rect x="10" y="2"  width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
              <rect x="2"  y="10" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span className={styles.brandName}>Students Onboarding Details</span>
        </div>

        {/* Progress segments */}
        <div className={styles.segments}>
          <div className={`${styles.seg} ${step >= 1 ? styles.segOn : ''}`}/>
          <div className={`${styles.seg} ${step >= 2 ? styles.segOn : ''}`}/>
        </div>

        {/* Heading */}
        <div className={styles.heading}>
          <span className={styles.stepLabel}>Step {step} of 2</span>
          <h1 className={styles.stepTitle}>{STEPS[step - 1].label}</h1>
          <p className={styles.stepSub}>{STEPS[step - 1].sub}</p>
        </div>

        {/* Form fields */}
        <div className={styles.formWrap} key={step}>
          {step === 1 && (<>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>First name</label>
                <input className={`${styles.input} ${e('firstName') ? styles.inputErr : ''}`}
                  name="firstName" value={form.firstName} onChange={onChange} placeholder="Jane" type="text"/>
                {e('firstName') && <span className={styles.errMsg}>{errs.firstName}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last name</label>
                <input className={`${styles.input} ${e('lastName') ? styles.inputErr : ''}`}
                  name="lastName" value={form.lastName} onChange={onChange} placeholder="Doe" type="text"/>
                {e('lastName') && <span className={styles.errMsg}>{errs.lastName}</span>}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone number</label>
              <input className={`${styles.input} ${e('phone') ? styles.inputErr : ''}`}
                name="phone" value={form.phone} onChange={onChange}
                placeholder="10-digit number" type="tel" maxLength="10"/>
              {e('phone') && <span className={styles.errMsg}>{errs.phone}</span>}
            </div>
          </>)}

          {step === 2 && (<>
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input className={`${styles.input} ${e('department') ? styles.inputErr : ''}`}
                name="department" value={form.department} onChange={onChange}
                placeholder="e.g. Computer Science" type="text"/>
              {e('department') && <span className={styles.errMsg}>{errs.department}</span>}
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Year of study</label>
                <select className={`${styles.select} ${e('yearOfStudy') ? styles.inputErr : ''}`}
                  name="yearOfStudy" value={form.yearOfStudy} onChange={onChange}>
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                {e('yearOfStudy') && <span className={styles.errMsg}>{errs.yearOfStudy}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>College name</label>
                <input className={`${styles.input} ${e('collegeName') ? styles.inputErr : ''}`}
                  name="collegeName" value={form.collegeName} onChange={onChange}
                  placeholder="Your college" type="text"/>
                {e('collegeName') && <span className={styles.errMsg}>{errs.collegeName}</span>}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Roll number</label>
              <input className={`${styles.input} ${e('rollNo') ? styles.inputErr : ''}`}
                name="rollNo" value={form.rollNo} onChange={onChange}
                placeholder="e.g. CS001" type="text"/>
              {e('rollNo') && <span className={styles.errMsg}>{errs.rollNo}</span>}
            </div>
          </>)}

          {error   && <div className={styles.errBanner}><span className={styles.dot}/>{error}</div>}
          {success && <div className={styles.okBanner}><span className={styles.dot}/>{success}</div>}
        </div>

        {/* Divider */}
        <div className={styles.divider}/>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnBack} onClick={back} disabled={step === 1}>Back</button>
          {step === 1
            ? <button className={styles.btnNext} onClick={next}>
                Continue
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            : <button className={styles.btnNext} onClick={submit} disabled={loading}>
                {loading
                  ? <><span className={styles.spin}/> Saving…</>
                  : <>Complete profile
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M8 2.5l4.5 4.5L8 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                }
              </button>
          }
        </div>

        {/* Hint */}
        
      </div>
    </div>
  );
}