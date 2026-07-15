import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Send, CreditCard, BarChart2, Bell } from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { path: '/transfer',  icon: Send,            label: 'Send'     },
  { path: '/requests',  icon: Bell,            label: 'Requests' },
  { path: '/vault',     icon: CreditCard,      label: 'Vault'    },
  { path: '/analytics', icon: BarChart2,       label: 'Insights' },
];

export default function Navbar() {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { socket, isAuthenticated } = useVaultStore();
  const [unread,   setUnread]   = useState(0);
  const [pending,  setPending]  = useState(0);

  // Fetch initial counts
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/notifications/unread-count').then(r => setUnread(r.data.count || 0)).catch(() => {});
    api.get('/requests/pending-count').then(r => setPending(r.data.count || 0)).catch(() => {});
  }, [isAuthenticated]);

  // Live updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const onNotif = ({ unreadCount }) => setUnread(unreadCount);
    socket.on('notification:new', onNotif);
    return () => socket.off('notification:new', onNotif);
  }, [socket]);

  const badge = (count, color = 'var(--cyber-blue)') =>
    count > 0 ? (
      <div style={{
        position: 'absolute', top: -2, right: -2,
        minWidth: 16, height: 16, borderRadius: 8,
        background: color, color: '#080810',
        fontSize: '0.58rem', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 3px', border: '2px solid #080810', lineHeight: 1
      }}>{count > 9 ? '9+' : count}</div>
    ) : null;

  return (
    <>
      {/* Top brand bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 58, background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,212,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800,
          letterSpacing: '0.22em',
          background: 'linear-gradient(135deg, var(--cyber-blue), var(--plasma-purple))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>VAULTX</span>

        {/* Top-right: notification bell */}
        <button
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
        >
          <Bell size={20} color={unread > 0 ? 'var(--cyber-blue)' : 'var(--dim-gray)'} />
          {badge(unread)}
        </button>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,212,255,0.07)',
        padding: '10px 0 env(safe-area-inset-bottom, 10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 480, margin: '0 auto' }}>
          {NAV.map(({ path, icon: Icon, label }) => {
            const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
            const showBadge = (path === '/requests' && pending > 0) || (path === '/notifications' && unread > 0);
            const badgeCount = path === '/requests' ? pending : unread;
            const badgeColor = path === '/requests' ? 'var(--gold)' : 'var(--cyber-blue)';

            return (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '4px 16px', background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'all 0.2s ease'
              }}>
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    width: 24, height: 2, background: 'var(--cyber-blue)', borderRadius: 1,
                    boxShadow: '0 0 8px var(--cyber-blue)'
                  }} />
                )}
                <div style={{ position: 'relative' }}>
                  <Icon size={21} color={isActive ? 'var(--cyber-blue)' : 'var(--dim-gray)'}
                    strokeWidth={isActive ? 2.2 : 1.6} />
                  {showBadge && badge(badgeCount, badgeColor)}
                </div>
                <span style={{
                  fontSize: '0.62rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--cyber-blue)' : 'var(--dim-gray)',
                  letterSpacing: '0.06em', textTransform: 'uppercase'
                }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
