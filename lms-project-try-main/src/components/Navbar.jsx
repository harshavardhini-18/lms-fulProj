
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import styles from './Navbar.module.css';
import { auth } from '../firebase';

function Navbar({ isAdmin = false }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Career', path: '/career' },
    { label: 'Profile', path: '/profile' },
    ...(isAdmin ? [{ label: 'Admin Users', path: '/admin/users' }] : []),
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
    });

    return () => unsubscribe();
  }, []);

  // Dropdown handlers
  const handleProfileClick = () => setDropdownOpen(v => !v);
  const handleProfileBlur = (e) => {
    // Close dropdown if focus leaves
    if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('lmsUserId');
    localStorage.removeItem('lmsUserRole');
    setDropdownOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.wrapper}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
         
          <span className={styles.brandText}>Better Tomorrow</span>
        </div>

        <div className={styles.menuWrap}>
          <ul className={styles.menu}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <span className={styles.bellWrap}>
              {/* <span className={styles.bellIcon}>🔔</span> */}
              {/* <span className={styles.notifDot} /> */}
            </span>
          </button>
          <div
            className={styles.profileWrap}
            tabIndex={0}
            onBlur={handleProfileBlur}
          >
            <button
              type="button"
              className={styles.userChip}
              aria-label="User profile"
              onClick={handleProfileClick}
              tabIndex={-1}
            >
              <span className={styles.userAvatar}>
                {authUser?.email ? (authUser.email[0] || 'U').toUpperCase() : 'A'}
              </span>
              <span className={styles.userCaret}>▾</span>
            </button>
            {dropdownOpen && (
              <div className={styles.profileDropdown}>
                {authUser ? (
                  <div className={styles.loggedInPane}>
                    <p className={styles.loginDropdownTitle}>Welcome</p>
                    <p className={styles.loggedInEmail}>{authUser.email}</p>
                    <button type="button" className={styles.loginButton} onClick={handleLogout}>Logout</button>
                  </div>
                ) : (
                  <div className={styles.loggedInPane}>
                    <p className={styles.loginDropdownTitle}>Session expired</p>
                    <button
                      type="button"
                      className={styles.loginButton}
                      onClick={() => navigate('/login', { replace: true })}
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
