import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { Workspace } from './components/Workspace';
import { WordPressConfirm } from './components/WordPressConfirm';
import { WordPressSettings } from './components/WordPressSettings';
import { AccountView } from './components/AccountView';
import { UnauthorizedView } from './components/UnauthorizedView';
import { ManualTestPage } from './components/ManualTestPage';
import { extractMenuFromImage } from './services/geminiService';
import { AppState, MenuData } from './types';
import { TEMPLATES, DEFAULT_PRICES } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, Menu } from 'lucide-react';

const MOCK_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2574&auto=format&fit=crop";

const INITIAL_MENU: MenuData = {
  categories: [],
  categoryPrices: DEFAULT_PRICES,
  wordpressConfig: { siteUrl: '', username: '', applicationPassword: '' }
};

export default function App() {
  const [state, setState] = useState<AppState>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fileName, setFileName] = useState('');
  const [menuData, setMenuData] = useState<MenuData>(INITIAL_MENU);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof TEMPLATES>('Rustic Bistro');

  const handleNavigate = (view: AppState) => {
    setState(view);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setState('processing');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageResult = e.target?.result as string;
      setOriginalImage(imageResult);
      
      try {
        const extractedData = await extractMenuFromImage(imageResult);
        console.log("Extracted Data Successfully:", extractedData);

        // Map extracted categories to default IDs if they are the first three
        const updatedCategories = extractedData.categories.map((cat, index) => {
            if (index === 0) return { ...cat, id: 'primer', title: 'Primer Plato' };
            if (index === 1) return { ...cat, id: 'segundo', title: 'Segundo Plato' };
            if (index === 2) return { ...cat, id: 'tercer', title: 'Tercer Plato' };
            return cat;
        });

        setMenuData(prev => ({
            ...prev, // Keep existing state first (including wordpressConfig)
            ...extractedData,
            categories: updatedCategories,
            categoryPrices: prev.categoryPrices // Preserve existing prices
        }));
        setState('editor');
      } catch (error) {
        console.error("AI processing failed:", error);
        setState('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
        <AccountView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 flex-col md:flex-row">
      <Sidebar 
        currentView={state} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        user={user}
      />
      
      <main className={`flex-1 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'} relative transition-all duration-300`}>
        {/* Persistent Header */}
        <header className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 rounded-md hover:bg-gray-100 text-gray-500">
                    <Menu className="w-5 h-5" />
                </button>
            )}
            {['editor', 'preview'].includes(state) && (
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${state === 'editor' ? 'bg-indigo-600 text-white' : 'bg-green-100 text-green-600'}`}>
                  {state === 'editor' ? '1' : '✓'}
                </div>
                <span className="text-sm font-bold text-gray-900 border-r border-gray-200 pr-4 mr-2">Review Content</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${state === 'preview' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  2
                </div>
                <span className="text-sm font-bold text-gray-900">Choose Design</span>
              </div>
            )}
            {!['editor', 'preview'].includes(state) && (
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100 focus-within:bg-white focus-within:border-indigo-200 transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input 
                  placeholder="Search projects, menus, or templates..." 
                  className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-gray-400"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-gray-700 max-w-[120px] truncate">{user.email}</span>
                <span className="text-[9px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded mt-0.5 select-all">UID: {user.uid}</span>
              </div>
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=4F46E5&color=fff`} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-50"
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {(state === 'dashboard' || state === 'upload') && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <UploadZone onFileSelect={handleFileSelect} />
              </motion.div>
            )}

            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProcessingState fileName={fileName} />
              </motion.div>
            )}

            {['editor', 'preview'].includes(state) && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Workspace 
                  menuData={menuData} 
                  onUpdate={setMenuData} 
                  originalImage={originalImage || MOCK_IMAGE}
                  view={state as 'editor' | 'preview'}
                  onViewChange={(v) => setState(v)}
                  onContinue={() => setState('wordpressSyncReview')}
                  onToggleSidebar={toggleSidebar}
                  selectedTheme={selectedTheme}
                />
              </motion.div>
            )}

            {state === 'wordpressSettings' && (
              <motion.div
                key="wordpressSettings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <WordPressSettings 
                    onBack={() => setState('dashboard')}
                />
              </motion.div>
            )}
            
            {state === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AccountView />
              </motion.div>
            )}
            
            {state === 'wordpressSyncReview' && (
              <motion.div
                key="wordpressSyncReview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <WordPressConfirm
                  menuData={menuData}
                  onConfirm={async () => {
                    try {
                      // Opt-in ID token if signed to Firebase
                      const token = await auth.currentUser?.getIdToken().catch(() => null);

                      // Load WordPress config from LocalStorage first, falling back to Firestore
                      let wordpressConfig = null;
                      const localSaved = localStorage.getItem('wordpress_config');
                      if (localSaved) {
                        try {
                          wordpressConfig = JSON.parse(localSaved);
                        } catch (e) {
                          console.error('Failed to parse local wordpress config', e);
                        }
                      }

                      if (!wordpressConfig && auth.currentUser) {
                        const docRef = doc(db, 'userConfigs', auth.currentUser.uid);
                        const docSnap = await getDoc(docRef).catch(() => null);
                        if (docSnap && docSnap.exists()) {
                          wordpressConfig = docSnap.data();
                        }
                      }

                      const response = await fetch('/api/sync-wordpress', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ 
                          menuData,
                          wordpressConfig
                        })
                      });
                      if (response.ok) {
                        const data = await response.json();
                        alert(data.message || 'Sync successful!');
                      } else {
                        const errText = await response.text();
                        throw new Error(errText || 'Sync failed');
                      }
                    } catch (error: any) {
                      alert(`WordPress Sync Error: ${error.message || 'Error syncing to WordPress'}`);
                    }
                    setState('dashboard');
                  }}
                  onCancel={() => setState('editor')}
                />
              </motion.div>
            )}

            {state === 'history' ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400"
              >
                <p className="text-xl font-bold mb-2 uppercase tracking-widest">{state}</p>
                <p>This feature is coming soon to your dashboard.</p>
              </motion.div>
            ) : null}

            {state === 'manualTest' && (
              <motion.div
                key="manualTest"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ManualTestPage />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

