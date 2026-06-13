import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Trash2, 
  Move, 
  Plus, 
  ChevronRight, 
  Eye, 
  Maximize2,
  MoreVertical,
  Type,
  Palette,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Save,
  Share2,
  Leaf,
  Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { TEMPLATES, DEFAULT_PRICES } from '../constants';
import { MenuCategory, MenuItem, MenuData } from '../types';

interface WorkspaceProps {
  menuData: MenuData;
  onUpdate: (data: MenuData) => void;
  originalImage: string | null;
  view: 'editor' | 'preview';
  onViewChange: (view: 'editor' | 'preview') => void;
  onContinue: () => void;
  onToggleSidebar: () => void;
  selectedTheme: keyof typeof TEMPLATES;
}

export const Workspace: React.FC<WorkspaceProps> = ({ menuData, onUpdate, originalImage, view, onViewChange, onContinue, onToggleSidebar, selectedTheme }) => {

  const [previewScale, setPreviewScale] = useState(0.48);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); 
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Split categories into pages
  const pages = React.useMemo(() => {
    // Explicitly define page content as requested:
    // Page 1: Primer Plato (0), Segundo Plato (1)
    // Page 2: Segundo Plato (1), Tercer Plato (2)
    if (menuData.categories.length >= 3) {
      return [
        [menuData.categories[0], menuData.categories[1]],
        [menuData.categories[1], menuData.categories[2]]
      ];
    }
    // Fallback for fewer categories
    const mid = Math.ceil(menuData.categories.length / 2);
    return [
      menuData.categories.slice(0, mid),
      menuData.categories.slice(mid)
    ];
  }, [menuData.categories]);

  useEffect(() => {
    if (view !== 'preview' || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const padding = 32;
      const scaleX = (width - padding) / 1000;
      const scaleY = (height - padding) / 731;
      setPreviewScale(Math.min(scaleX, scaleY)); 
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [view]);

  const themes = Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[];

  const handleExport = async () => {
    if (!menuRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Store current transform and overflow
      const originalTransform = menuRef.current.style.transform;
      const menuContent = menuRef.current.querySelector('.overflow-y-auto') as HTMLElement;
      
      // Inject temporary styles to hide scrollbars
      const style = document.createElement('style');
      style.innerHTML = `
        .custom-scrollbar::-webkit-scrollbar { display: none !important; }
        .custom-scrollbar { scrollbar-width: none !important; }
      `;
      document.head.appendChild(style);

      // Reset transform and hide scrollbar for capture
      menuRef.current.style.transform = 'none';
      const originalOverflow = menuContent?.style.overflow;
      const originalOverflowX = menuContent?.style.overflowX;
      if (menuContent) {
        menuContent.style.overflow = 'hidden';
        menuContent.style.overflowX = 'hidden';
      }
      
      const dataUrl = await toPng(menuRef.current, {
        quality: 1.0,
        pixelRatio: 3, // High quality for print
        backgroundColor: '#ffffff',
        width: 1000,
        height: 731,
        style: {
          transform: 'none',
          borderRadius: '0' // Ensure sharp corners for print
        }
      });
      
      // Restore original UI scale and overflow
      menuRef.current.style.transform = originalTransform;
      if (menuContent) {
        menuContent.style.overflow = originalOverflow || '';
        menuContent.style.overflowX = originalOverflowX || '';
      }
      
      // Cleanup styles
      document.head.removeChild(style);
      
      download(dataUrl, `garibolo-menu-export.png`);
    } catch (err) {
      console.error('Failed to export menu:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddItem = (categoryId: string) => {
    const newCategories = menuData.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, { id: Math.random().toString(), name: '', description: '', price: '$0.00' }]
        };
      }
      return cat;
    });
    onUpdate({ categories: newCategories });
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const newCategories = menuData.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      }
      return cat;
    });
    onUpdate({ categories: newCategories });
  };

  const handleUpdateItem = (categoryId: string, itemId: string, field: keyof MenuItem, value: string) => {
    const newCategories = menuData.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              return { ...item, [field]: value };
            }
            return item;
          })
        };
      }
      return cat;
    });
    onUpdate({ categories: newCategories });
  };

  return (
    <div className="flex h-[calc(100vh-128px)] gap-6">
      <AnimatePresence mode="wait">
        {view === 'editor' ? (
          /* STEP 1: EDITOR VIEW */
          <motion.div 
            key="editor-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex w-full gap-6"
          >
            {/* Left Column: Source Panel (35%) */}
            <div className="w-[35%] flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  Source Verification
                </h3>
              </div>
              <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl relative group">
                {originalImage ? (
                  <img 
                    src={originalImage} 
                    alt="Original Menu" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Reference image loading...</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs">
                    Cross-check extracted text here
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Editor Panel (65%) */}
            <div className="w-[65%] flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  Extracted Categories & Dishes
                </h3>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinue}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  Continue to Sync
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar pb-12">
                {menuData.categories.map((category) => (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                      <input 
                        value={category.title}
                        onChange={(e) => {
                          const newCats = menuData.categories.map(c => c.id === category.id ? {...c, title: e.target.value} : c);
                          onUpdate({ ...menuData, categories: newCats });
                        }}
                        className="font-black text-lg text-gray-900 bg-transparent border-none focus:ring-0 p-0"
                      />
                      <input 
                        type="text"
                        value={menuData.categoryPrices?.[category.id] || ''}
                        placeholder="Category Price"
                        onChange={(e) => {
                          const newPrices = {
                            ...menuData.categoryPrices,
                            [category.id]: e.target.value
                          };
                          onUpdate({ ...menuData, categoryPrices: newPrices });
                        }}
                        className="w-24 text-right bg-white p-2 rounded-lg text-sm border border-gray-200"
                      />
                    </div>

                    <AnimatePresence mode="popLayout">
                      {category.items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 transition-all group"
                        >
                          <div className="flex gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex gap-4">
                                <input
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(category.id, item.id, 'name', e.target.value)}
                                  className="flex-1 bg-transparent border-none font-bold text-gray-900 focus:ring-0 placeholder:text-gray-300 p-0 text-lg"
                                  placeholder="Dish Name"
                                />
                                <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 focus-within:border-indigo-300 transition-colors h-10">
                                  <span className="text-gray-400 text-sm font-bold mr-1">$</span>
                                  <input
                                    value={item.price.replace('$', '')}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'price', `$${e.target.value}`)}
                                    className="w-16 bg-transparent border-none font-black text-indigo-600 focus:ring-0 text-sm p-0 text-right"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateItem(category.id, item.id, 'description', e.target.value)}
                                className="w-full bg-transparent border-none text-sm text-gray-500 focus:ring-0 placeholder:text-gray-300 p-0 resize-none min-h-[40px]"
                                placeholder="Describe the ingredients or preparation method..."
                                rows={2}
                              />
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleDeleteItem(category.id, item.id)}
                                className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-colors" title="Move Category">
                                <Move className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <button 
                      onClick={() => handleAddItem(category.id)}
                      className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all group"
                    >
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="font-bold text-sm tracking-tight">Add New Item to {category.title}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* STEP 2: PREVIEW VIEW */
          <motion.div 
            key="preview-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex w-full gap-6"
          >
            <div className="w-full flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => onViewChange('editor')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="w-px h-4 bg-gray-200" />
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    Production Menu Preview (Landscape)
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-indigo-600 text-white h-10 px-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export
                  </motion.button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4 justify-center">
                <button 
                  onClick={() => setCurrentPage(0)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${currentPage === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Page 1
                </button>
                <button 
                  onClick={() => setCurrentPage(1)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${currentPage === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Page 2
                </button>
              </div>
              
              <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center overflow-hidden relative"
              >
                {/* Scale wrapper to ensure "contain" logic for the generated menu */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                   <div 
                      ref={menuRef}
                      style={{ 
                        width: '1000px', 
                        height: '731px', 
                        transform: `scale(${previewScale})`, 
                        transformOrigin: 'center center',
                        flexShrink: 0
                      }}
                      className={`shadow-2xl flex relative overflow-hidden transition-transform duration-300 ease-out ${TEMPLATES[selectedTheme].container}`}
                    >
                      {/* Menu Content Container - Multi-column Layout */}
                      <div 
                        style={{ 
                          columns: '2', 
                          columnGap: '3rem', 
                          columnRule: '1px solid rgba(0,0,0,0.05)' 
                        }} 
                        className="p-8 w-full h-full overflow-y-auto custom-scrollbar"
                      >
                        <div className="w-full text-center mb-8 break-inside-avoid">
                          <div className={TEMPLATES[selectedTheme].title}>
                            <span>Garibolo</span>
                            {selectedTheme === 'Modern Mono' && <span className="text-xl font-normal">v2.0</span>}
                          </div>
                          <div className="flex items-center justify-center gap-4 mt-2">
                            <div className="h-px bg-gray-300 w-8"></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">Restaurante Vegetariano</span>
                            <div className="h-px bg-gray-300 w-8"></div>
                          </div>
                        </div>

                        <div className="w-full space-y-6">
                          {pages[currentPage].map((category) => (
                             <div key={category.id} className="w-full break-inside-avoid mb-6">
                               <h2 className={TEMPLATES[selectedTheme].categoryHeader}>{category.title}</h2>
                               <div className="space-y-4">
                                 {category.items.map((item) => (
                                   <div key={item.id} className="flex justify-between items-start group/item break-inside-avoid">
                                     <div className="flex-1 pr-6">
                                       <h3 className={TEMPLATES[selectedTheme].itemName}>{item.name}</h3>
                                       {item.description && <p className={TEMPLATES[selectedTheme].itemDesc}>{item.description}</p>}
                                     </div>
                                     <span className={TEMPLATES[selectedTheme].itemPrice}>
                                       {menuData.categoryPrices?.[category.id] 
                                         ? `${menuData.categoryPrices[category.id]}€` 
                                         : (item.price.includes('€') ? item.price : `${item.price}€`)}
                                     </span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                          ))}
                        </div>

                        <div className="mt-8 pt-6 text-[10px] text-gray-300 text-center uppercase tracking-[0.8em] w-full border-t border-gray-100/5 break-inside-avoid">
                          <Leaf className="w-3 h-3 mx-auto text-gray-200" />
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
