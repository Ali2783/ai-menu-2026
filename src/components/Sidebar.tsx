import React from 'react';
import { LayoutDashboard, History, BookOpen, UserCircle, Menu, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';

import { AppState } from '../types';

interface SidebarProps {
  currentView: AppState;
  onNavigate: (view: AppState) => void;
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onToggle, user }) => {
  const navItems: { icon: any; label: string; view: AppState }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: Sparkles, label: 'Interactive Playground', view: 'manualTest' },
    { icon: History, label: 'History', view: 'history' },
    { icon: BookOpen, label: 'WordPress Settings', view: 'wordpressSettings' },
    { icon: UserCircle, label: 'Account', view: 'account' }, // Placeholder for account
  ];

  return (
    <div className={`h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div 
        className="p-6 flex items-center justify-between gap-3 cursor-pointer group"
        onClick={() => onNavigate('dashboard')}
      >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Menu className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">menuanalizer</span>
        </div>
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === item.view
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {user && (
        <div className="p-6 text-xs text-gray-400 truncate border-t border-gray-100">
            UID: {user.uid}
        </div>
      )}

    </div>
  );
};
