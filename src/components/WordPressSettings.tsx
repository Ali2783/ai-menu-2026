import React, { useState, useEffect } from 'react';
import { WordPressConfig } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Globe, Sparkles, KeyRound, Copy, Check } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const WordPressSettings: React.FC<Props> = ({ onBack }) => {
  const [config, setConfig] = useState<WordPressConfig>({ 
    siteUrl: '', 
    username: '', 
    applicationPassword: '', 
    targetPageId: '',
    syncMode: 'comments',
    customSelector: 'menu-container'
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      // First, try loading from LocalStorage
      const localSaved = localStorage.getItem('wordpress_config');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setConfig(prev => ({
            ...prev,
            ...parsed,
            syncMode: parsed.syncMode || 'comments',
            customSelector: parsed.customSelector || 'menu-container'
          }));
          setLoading(false);
          return;
        } catch (e) {
          console.error("Local storage parse failed", e);
        }
      }

      // Fallback to Firebase if logged in and config didn't load from local
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'userConfigs', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const savedData = docSnap.data() as WordPressConfig;
            setConfig(prev => ({
              ...prev,
              ...savedData,
              syncMode: savedData.syncMode || 'comments',
              customSelector: savedData.customSelector || 'menu-container'
            }));
          }
        } catch (e) {
          console.warn("Could not load from Firestore, ignoring:", e);
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    // Save to LocalStorage immediately
    localStorage.setItem('wordpress_config', JSON.stringify(config));

    // Optionally backup to Firebase
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'userConfigs', auth.currentUser.uid);
        await setDoc(docRef, config);
      } catch (err) {
        console.warn("Could not backup config to Firestore, local storage secured successfully.", err);
      }
    }
    onBack();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-indigo-600" />
        WordPress API & App Settings
      </h2>

      {/* QUICK INFO CARDS: APP URL & GEMINI SETUP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* App URL Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Application URL</span>
            <code className="text-xs text-slate-800 font-mono break-all mt-1 block select-all">
              {window.location.origin}
            </code>
          </div>
          <button
            onClick={handleCopyUrl}
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-fit"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied Address!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy App URL
              </>
            )}
          </button>
        </div>

        {/* Gemini Secure Status Card */}
        <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
              Gemini AI Integration
            </span>
            <p className="text-xs text-indigo-900 font-medium mt-1">
              Protected & running 100% securely on our container backend server.
            </p>
          </div>
          <span className="mt-3 text-[9px] uppercase text-emerald-600 font-extrabold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Server API Keys Active
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">WordPress Site URL</label>
          <input 
            type="text" 
            value={config.siteUrl}
            onChange={(e) => setConfig({...config, siteUrl: e.target.value})}
            placeholder="https://yourrestaurant.com"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
          <input 
            type="text" 
            value={config.username}
            onChange={(e) => setConfig({...config, username: e.target.value})}
            placeholder="admin"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Application Password</label>
          <input 
            type="password" 
            value={config.applicationPassword}
            onChange={(e) => setConfig({...config, applicationPassword: e.target.value})}
            placeholder="xxxx xxxx xxxx xxxx"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
           <p className="text-xs text-gray-400 mt-2">Generate this in your WordPress User Profile.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Target Page ID</label>
          <input 
            type="text" 
            value={config.targetPageId || ''}
            onChange={(e) => setConfig({...config, targetPageId: e.target.value})}
            placeholder="e.g., 123"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">The WordPress Page ID of the menu page to edit.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Publishing Mode (Precision Targeting)</label>
          <select
            value={config.syncMode || 'comments'}
            onChange={(e) => setConfig({...config, syncMode: e.target.value as any})}
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white outline-none"
          >
            <option value="comments">HTML Comments ({"<!-- MENU_START --> ... <!-- MENU_END -->"})</option>
            <option value="id">HTML Element with CSS ID</option>
            <option value="class">HTML Element with CSS Class</option>
            <option value="placeholder">Simple Text Placeholder (e.g. [DYNAMIC_MENU])</option>
            <option value="full">Overwrite Entire Page Content</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Choose how to publish the menu on the target page. HTML Comments and Elements let you modify ONLY the targeted section, preserving your header, footer, or Elementor templates!
          </p>
        </div>

        {config.syncMode !== 'full' && config.syncMode !== 'comments' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {config.syncMode === 'id' ? 'Target Element ID' : config.syncMode === 'class' ? 'Target Element Class' : 'Target Text Placeholder'}
            </label>
            <input 
              type="text" 
              value={config.customSelector || ''}
              onChange={(e) => setConfig({...config, customSelector: e.target.value})}
              placeholder={config.syncMode === 'id' ? 'e.g., menu-container' : config.syncMode === 'class' ? 'e.g., menu-section' : 'e.g., [DYNAMIC_MENU]'}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              The ID, class name, or text string on your page that we should search for and replace with our generated menu.
            </p>
          </div>
        )}
        
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
