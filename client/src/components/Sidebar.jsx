import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = {
  subscriber: [
    { label: 'Dashboard', path: '/dashboard', icon: '⚡' },
    { label: 'My Leads', path: '/dashboard', icon: '📋' },
    { label: 'Analytics', path: null, icon: '📊', disabled: true },
    { label: 'Settings', path: null, icon: '⚙️', disabled: true }
  ],
  admin: [
    { label: 'Admin Panel', path: '/admin', icon: '🛠️' },
    { label: 'Analytics', path: null, icon: '📊', disabled: true },
    { label: 'Settings', path: null, icon: '⚙️', disabled: true }
  ]
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.subscriber;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed left-0 top-0 h-full w-64 z-50 flex flex-col',
          'bg-surface border-r border-subtle',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:relative md:z-auto md:transition-none'
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-subtle">
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              <span className="text-white">Legen</span>
              <span className="text-accent">ly</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">Lead Marketplace</p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden text-muted hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-heading font-bold text-sm">
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || user?.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                <span className="text-xs text-muted capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
          {user?.market && (
            <p className="text-xs text-muted mt-3 px-1 truncate">
              📍 {user.market}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path && !item.disabled) {
                    navigate(item.path);
                    onClose?.();
                  }
                }}
                disabled={item.disabled}
                className={[
                  'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  item.disabled
                    ? 'text-muted/40 cursor-not-allowed'
                    : isActive
                    ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                    : 'text-muted hover:text-white hover:bg-white/5'
                ].join(' ')}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs bg-subtle px-1.5 py-0.5 rounded text-muted/60">
                    soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-subtle pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <span className="text-base leading-none">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
