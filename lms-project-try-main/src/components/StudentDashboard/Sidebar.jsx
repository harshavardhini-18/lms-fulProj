import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Timer,
  MessageCircle,
  MessageSquare,
  Library,
  AppWindow,
  CalendarDays,
  Megaphone,
  HelpCircle,
  Settings,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";

const sections = [
  {
    label: "General",
    items: [
      { icon: LayoutDashboard, label: "Dashboard" },
      { icon: BookOpen, label: "Courses" },
      { icon: BarChart2, label: "Analytics" },
      { icon: Timer, label: "Time Tracker" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { icon: MessageCircle, label: "Messages", badge: 3 },
      { icon: MessageSquare, label: "Discussion" },
      { icon: Library, label: "Resources" },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: AppWindow, label: "Module" },
      { icon: CalendarDays, label: "Calendar" },
      { icon: Megaphone, label: "Community" },
    ],
  },
];

const bottomItems = [
  { icon: HelpCircle, label: "Help Center" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar({ isOpen = true, onClose }) {
  const [active, setActive] = useState("Dashboard");
  const studentName = "Steve Rogers";
  const studentRole = "E-Learning Student";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .sidebar-root {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .sidebar-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 450;
          color: #52525b;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, color 0.15s ease;
          letter-spacing: -0.01em;
        }

        .sidebar-item:hover {
          background: rgba(0,0,0,0.04);
          color: #18181b;
        }

        .sidebar-item.active {
          background: #ffffff;
          color: #18181b;
          font-weight: 550;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
        }

        .sidebar-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2.5px;
          height: 60%;
          background: #3b82f6;
          border-radius: 0 2px 2px 0;
        }

        .sidebar-item .item-icon {
          flex-shrink: 0;
          color: #a1a1aa;
          transition: color 0.15s ease;
        }

        .sidebar-item:hover .item-icon,
        .sidebar-item.active .item-icon {
          color: #3b82f6;
        }

        .badge {
          margin-left: auto;
          background: #3b82f6;
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 20px;
          line-height: 16px;
        }

        .section-label {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #a1a1aa;
          padding: 0 10px;
          margin-bottom: 4px;
          margin-top: 2px;
          user-select: none;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .profile-btn:hover { background: rgba(0,0,0,0.04); }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .avatar span {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .online-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          border: 1.5px solid #F5F7FA;
        }

        .divider {
          height: 1px;
          background: rgba(0,0,0,0.06);
          margin: 0 16px;
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Mobile overlay */}
      {isOpen === false && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      <aside
        className="sidebar-root"
        style={{
          width: 272,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#F5F7FA",
          borderRight: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {/* Profile */}
        <div style={{ padding: "18px 12px 14px" }}>
          <button className="profile-btn">
            <div className="avatar">
              <span>{studentName.charAt(0)}</span>
              <div className="online-dot" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 580, color: "#18181b", margin: 0, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {studentName}
              </p>
              <p style={{ fontSize: 11.5, color: "#a1a1aa", margin: "1px 0 0", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {studentRole}
              </p>
            </div>
            <ChevronsUpDown size={14} strokeWidth={2} style={{ color: "#c4c4cc", flexShrink: 0 }} />
          </button>
        </div>

        <div className="divider" />

        {/* Nav */}
        <nav
          className="scrollbar-hide"
          style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 20 }}
        >
          {sections.map((section) => (
            <div key={section.label}>
              <div className="section-label">{section.label}</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                {section.items.map(({ icon: Icon, label, badge }) => {
                  const isActive = active === label;
                  return (
                    <li key={label}>
                      <button
                        className={`sidebar-item${isActive ? " active" : ""}`}
                        onClick={() => setActive(label)}
                      >
                        <Icon size={16} strokeWidth={1.9} className="item-icon" />
                        <span style={{ flex: 1 }}>{label}</span>
                        {badge && <span className="badge">{badge}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="divider" />

        {/* Bottom */}
        <div style={{ padding: "10px 10px 16px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {bottomItems.map(({ icon: Icon, label }) => (
              <li key={label}>
                <button className="sidebar-item">
                  <Icon size={16} strokeWidth={1.9} className="item-icon" />
                  {label}
                </button>
              </li>
            ))}
            <li>
              <button
                className="sidebar-item"
                style={{ marginTop: 2 }}
              >
                <LogOut size={16} strokeWidth={1.9} className="item-icon" style={{ color: "#f87171" }} />
                <span style={{ color: "#f87171" }}>Log out</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
