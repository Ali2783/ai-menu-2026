import React, { useState } from 'react';
import { Plus, Trash2, Send, RefreshCw, Layers, Sparkles, Check, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface ManualDish {
  id: string;
  name: string;
  description: string;
  price: string;
  targetNameType?: 'none' | 'id' | 'class' | 'placeholder';
  targetNameValue?: string;
  targetPriceType?: 'none' | 'id' | 'class' | 'placeholder';
  targetPriceValue?: string;
  targetDescType?: 'none' | 'id' | 'class' | 'placeholder';
  targetDescValue?: string;
  showTargeting?: boolean;
}

interface ManualCategory {
  id: string;
  title: string;
  items: ManualDish[];
  targetSelectorType?: 'comments' | 'id' | 'class' | 'placeholder';
  targetSelectorValue?: string;
}

export const ManualTestPage: React.FC = () => {
  const [categories, setCategories] = useState<ManualCategory[]>([
    {
      id: 'cat-1',
      title: 'Chef Specialities',
      items: [
        { 
          id: 'dish-1', 
          name: 'Premium Grilled Steak', 
          description: 'Tender ribeye steak served with rosemary butter and potato wedges', 
          price: '$28.00',
          targetNameType: 'none',
          targetNameValue: '',
          targetPriceType: 'none',
          targetPriceValue: '',
          targetDescType: 'none',
          targetDescValue: '',
          showTargeting: false
        },
        { 
          id: 'dish-2', 
          name: 'Mediterranean Sea Bass', 
          description: 'Pan-seared fresh sea bass over sauteed spinach and lemon-herb olive oil', 
          price: '$24.50',
          targetNameType: 'none',
          targetNameValue: '',
          targetPriceType: 'none',
          targetPriceValue: '',
          targetDescType: 'none',
          targetDescValue: '',
          showTargeting: false
        }
      ],
      targetSelectorType: 'comments',
      targetSelectorValue: 'CHEF_SPECIALITIES'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showElementorGuide, setShowElementorGuide] = useState(true);

  const addCategory = () => {
    const newId = `cat-${Date.now()}`;
    const slug = `CATEGORY_${categories.length + 1}`;
    setCategories([...categories, {
      id: newId,
      title: 'New Category',
      items: [],
      targetSelectorType: 'comments',
      targetSelectorValue: slug
    }]);
  };

  const removeCategory = (catId: string) => {
    setCategories(categories.filter(c => c.id !== catId));
  };

  const updateCategoryTitle = (catId: string, title: string) => {
    setCategories(categories.map(c => c.id === catId ? { ...c, title } : c));
  };

  const updateCategorySelector = (catId: string, field: 'targetSelectorType' | 'targetSelectorValue', value: string) => {
    setCategories(categories.map(c => c.id === catId ? { ...c, [field]: value } : c));
  };

  const addDish = (catId: string) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [
            ...c.items,
            { 
              id: `dish-${Date.now()}`, 
              name: 'New Dish', 
              description: 'Dish description...', 
              price: '$0.00',
              targetNameType: 'none',
              targetNameValue: '',
              targetPriceType: 'none',
              targetPriceValue: '',
              targetDescType: 'none',
              targetDescValue: '',
              showTargeting: false
            }
          ]
        };
      }
      return c;
    }));
  };

  const removeDish = (catId: string, dishId: string) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.filter(item => item.id !== dishId)
        };
      }
      return c;
    }));
  };

  const updateDish = (catId: string, dishId: string, field: keyof ManualDish, value: any) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(item => item.id === dishId ? { ...item, [field]: value } : item)
        };
      }
      return c;
    }));
  };

  const getCombinedActions = () => {
    const list: any[] = [];
    
    categories.forEach(cat => {
      let catHasDishTargets = false;
      
      // Look at all dishes in this category
      cat.items.forEach(dish => {
        const hasNameTarget = dish.targetNameType && dish.targetNameType !== 'none' && dish.targetNameValue;
        const hasPriceTarget = dish.targetPriceType && dish.targetPriceType !== 'none' && dish.targetPriceValue;
        const hasDescTarget = dish.targetDescType && dish.targetDescType !== 'none' && dish.targetDescValue;
        
        if (hasNameTarget || hasPriceTarget || hasDescTarget) {
          catHasDishTargets = true;
        }

        if (hasNameTarget) {
          list.push({
            mode: dish.targetNameType,
            selector: dish.targetNameValue,
            content: dish.name
          });
        }
        if (hasPriceTarget) {
          list.push({
            mode: dish.targetPriceType,
            selector: dish.targetPriceValue,
            content: dish.price
          });
        }
        if (hasDescTarget) {
          list.push({
            mode: dish.targetDescType,
            selector: dish.targetDescValue,
            content: dish.description
          });
        }
      });
      
      // If the category itself has targeting configured:
      if (cat.targetSelectorValue) {
        let catHtml = `<div class="menu-category" style="margin-bottom: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">`;
        catHtml += `<div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #4f46e5; margin-bottom: 1.5rem; padding-bottom: 0.5rem;">`;
        catHtml += `<h2 style="margin: 0; font-size: 1.5rem; color: #4f46e5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${cat.title}</h2>`;
        catHtml += `</div>`;
        
        // Exclude dishes that are independently targeted to prevent double rendering
        const nonIndividuallyTargetedDishes = cat.items.filter(dish => {
          const hasName = dish.targetNameType && dish.targetNameType !== 'none' && dish.targetNameValue;
          const hasPrice = dish.targetPriceType && dish.targetPriceType !== 'none' && dish.targetPriceValue;
          return !hasName && !hasPrice;
        });

        if (nonIndividuallyTargetedDishes.length > 0) {
          catHtml += `<div class="menu-items" style="display: flex; flex-direction: column; gap: 1.25rem;">`;
          for (const item of nonIndividuallyTargetedDishes) {
            catHtml += `<div class="menu-item" style="border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem;">`;
            catHtml += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">`;
            catHtml += `<h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827; text-align: left;">${item.name}</h3>`;
            if (item.price) {
              catHtml += `<span style="font-weight: 700; color: #4b5563; font-size: 1rem;">${item.price}</span>`;
            }
            catHtml += `</div>`;
            if (item.description) {
              catHtml += `<p style="margin: 0; font-size: 0.95rem; color: #6b7280; text-align: left;">${item.description}</p>`;
            }
            catHtml += `</div>`;
          }
          catHtml += `</div>`;
        }
        
        catHtml += `</div>`;
        
        if (nonIndividuallyTargetedDishes.length > 0 || !catHasDishTargets) {
          list.push({
            mode: cat.targetSelectorType || 'comments',
            selector: cat.targetSelectorValue,
            content: catHtml
          });
        }
      }
    });

    return list;
  };

  const handleSingleDishSync = async (dish: ManualDish) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      const actions: any[] = [];
      if (dish.targetNameType && dish.targetNameType !== 'none' && dish.targetNameValue) {
        actions.push({
          mode: dish.targetNameType,
          selector: dish.targetNameValue,
          content: dish.name
        });
      }
      if (dish.targetPriceType && dish.targetPriceType !== 'none' && dish.targetPriceValue) {
        actions.push({
          mode: dish.targetPriceType,
          selector: dish.targetPriceValue,
          content: dish.price
        });
      }
      if (dish.targetDescType && dish.targetDescType !== 'none' && dish.targetDescValue) {
        actions.push({
          mode: dish.targetDescType,
          selector: dish.targetDescValue,
          content: dish.description
        });
      }

      if (actions.length === 0) {
        throw new Error('No target containers configured for this dish elements. Please enable CSS Class or CSS ID targeting for Name, Price or Description below first!');
      }

      let wordpressConfig = null;
      if (user) {
        const docRef = doc(db, 'userConfigs', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          wordpressConfig = docSnap.data();
        }
      }

      const response = await fetch('/api/sync-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actions,
          wordpressConfig
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sync dish elements to WordPress');
      }

      setStatusMsg({ type: 'success', text: `Successfully synced the targeted elements of "${dish.name}" to your WordPress page!` });
    } catch (error: any) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.message || 'Error occurred while syncing individual item.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleCategorySync = async (category: ManualCategory) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      let wordpressConfig = null;
      if (user) {
        const docRef = doc(db, 'userConfigs', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          wordpressConfig = docSnap.data();
        }
      }

      const response = await fetch('/api/sync-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          singleCategory: {
            title: category.title,
            items: category.items.map(i => ({ name: i.name, description: i.description, price: i.price }))
          },
          syncModeOverride: category.targetSelectorType || 'comments',
          customSelectorOverride: category.targetSelectorValue || 'menu-container',
          wordpressConfig
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sync category to WordPress');
      }

      const data = await response.json();
      setStatusMsg({ type: 'success', text: `Successfully synced only the "${category.title}" section to your WordPress page!` });
    } catch (error: any) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.message || 'Error occurred while syncing single section.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToWordPress = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      let wordpressConfig = null;
      if (user) {
        const docRef = doc(db, 'userConfigs', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          wordpressConfig = docSnap.data();
        }
      }

      const actions = getCombinedActions();
      const payload: any = { wordpressConfig };

      if (actions.length > 0) {
        payload.actions = actions;
      } else {
        payload.menuData = {
          categories: categories.map(c => ({
            id: c.id,
            title: c.title,
            items: c.items.map(i => ({
              id: i.id,
              name: i.name,
              description: i.description,
              price: i.price
            }))
          })),
          categoryPrices: {},
          wordpressConfig: {}
        };
      }

      const response = await fetch('/api/sync-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sync to WordPress');
      }

      const data = await response.json();
      setStatusMsg({ 
        type: 'success', 
        text: actions.length > 0 
          ? `Successfully targeted and synced ${actions.length} Elementor elements with surgical precision!`
          : (data.message || 'Menu synced to WordPress successfully!') 
      });
    } catch (error: any) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.message || 'Error occurred while syncing.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-950 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Interactive WordPress Testing Playground
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add custom categories and gourmet dishes manually underneath to test live publishing to your targeted page.
            </p>
          </div>
          <button
            onClick={handleSyncToWordPress}
            disabled={loading}
            className="self-start sm:self-center bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Publish Test Menu
          </button>
        </div>

        {statusMsg && (
          <div className="space-y-4 mb-6">
            <div className={`p-4 rounded-xl flex items-start gap-3 transition-all ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              {statusMsg.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">{statusMsg.type === 'success' ? 'Sync Successful!' : 'Sync Failed'}</p>
                <div className="text-xs opacity-90 mt-0.5 whitespace-pre-wrap">{statusMsg.text}</div>
              </div>
            </div>

            {/* ELEMENTOR TROUBLESHOOTING HELP GUIDE */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 text-amber-950 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                  WordPress & Elementor Integration Help Guide
                </span>
                <button
                  onClick={() => setShowElementorGuide(!showElementorGuide)}
                  className="text-amber-700 hover:text-amber-950 text-xs font-bold underline cursor-pointer"
                >
                  {showElementorGuide ? 'Hide Guide' : 'Show Guide'}
                </button>
              </div>

              {showElementorGuide && (
                <div className="text-xs space-y-4 leading-relaxed">
                  <p className="text-[12px] font-medium text-amber-900">
                    Yes! Writing CSS IDs inside Elementor and syncing raw HTML often runs into common WordPress template constraints. Here are direct answers to your questions, along with <strong>outstanding helper plugins</strong> that bridge this perfectly:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 p-3.5 rounded-lg border border-amber-200/40 space-y-2">
                      <span className="font-bold text-amber-950 block">Q1: Is it because the page is not published?</span>
                      <p className="text-amber-800/90 text-[11px]">
                        <strong>Yes, absolutely.</strong> If a page is saved as a draft, revision, or unpublished, WordPress doesn't compile and output the actual HTML structure on the live frontend. That means custom CSS IDs (like <code>proba23</code>) only live inside Elementor's memory and are <strong>never</strong> rendered to standard REST API payloads! <strong>Ensure your page is Published first.</strong>
                      </p>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-lg border border-amber-200/40 space-y-2">
                      <span className="font-bold text-amber-950 block">Q2: Why successful sync but no visible change?</span>
                      <p className="text-amber-800/90 text-[11px]">
                        Elementor completely hijacks the page display by rendering its own layout database fields (<code>_elementor_data</code>), bypassing the standard WordPress page content. When our app edits standard content successfully, Elementor active templates ignore it and keep showing the cached builder template.
                      </p>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-lg border border-amber-200/40 space-y-2">
                      <span className="font-bold text-amber-950 block">Q3: Why say "CSS ID proba23 was not found"?</span>
                      <p className="text-amber-800/90 text-[11px]">
                        The WordPress REST API GET returns the simple database body content. Since Elementor's dynamic compiler only outputs widgets inside a custom canvas on user visits, the raw database text is blank of Elementor layouts, causing the CSS ID selector check to fail.
                      </p>
                    </div>
                  </div>

                  {/* FREE HELPER PLUGINS SECTION */}
                  <div className="mt-4 bg-indigo-50 border border-indigo-150 p-5 rounded-lg text-indigo-950 space-y-3">
                    <h4 className="font-extrabold text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      🔌 Highly Recommended Plugins to Bridge Elementor with APIs (Free & Fast)
                    </h4>
                    
                    <div className="space-y-4 text-[11px]">
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 flex gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs">1</span>
                        <div>
                          <strong className="text-indigo-950 text-xs block">Option A: Install "Insert Pages" Plugin (Absolute Best & Bulletproof)</strong>
                          <p className="text-indigo-900/80 mt-1">
                            This free plugin lets you insert standard content into Elementor using a clean shortcode. It is the gold standard for full API compatibility!
                          </p>
                          <ol className="list-decimal pl-4 mt-2 space-y-1 text-indigo-950/95 font-medium">
                            <li>Create a brand new Standard WordPress Page (e.g. titled "Menu Feed", ID <code>123</code>). <strong>Do NOT use Elementor for this feed page.</strong></li>
                            <li>Configure this App to sync to that Feed Page ID (<code>123</code>) using standard <strong>HTML Comments</strong> or <strong>Overwrite Entire Page</strong>. It will sync instantaneously.</li>
                            <li>Install the free WordPress plugin <strong className="text-indigo-600">Insert Pages</strong> by Paul Ryan.</li>
                            <li>Go to your beautiful Elementor page, drop in a standard <strong className="font-semibold text-indigo-900">Shortcode Widget</strong>, and type: <code className="bg-indigo-50 px-1 py-0.5 rounded text-indigo-700 font-mono">[insert page='123' display='content']</code>.</li>
                            <li>Click Update. Now, your Elementor page dynamically embeds the menu feed in real-time, working flawlessy!</li>
                          </ol>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-indigo-100 flex gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs">2</span>
                        <div>
                          <strong className="text-indigo-950 text-xs block">Option B: Use "Code Snippets" Plugin to Register a Custom Shortcode</strong>
                          <p className="text-indigo-900/80 mt-1">
                            If you do not want to install bulky layout packages, you can register a custom shortcode in seconds.
                          </p>
                          <ol className="list-decimal pl-4 mt-2 space-y-1 text-indigo-950/95 font-medium">
                            <li>Install <strong className="text-indigo-600">Code Snippets</strong> plugin on WordPress (or paste into your theme's <code className="font-mono">functions.php</code>).</li>
                            <li>Create a PHP snippet with the following code:
                              <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded text-[10px] font-mono leading-normal select-all">
{`add_shortcode('sync_menu', function($atts) {
    $a = shortcode_atts(array('id' => ''), $atts);
    if (empty($a['id'])) return '';
    $post = get_post(intval($a['id']));
    return $post ? do_shortcode($post->post_content) : '';
});`}
                              </pre>
                            </li>
                            <li>Inside Elementor, add a standard Shortcode widget with <code className="bg-indigo-50 px-1 py-0.5 rounded text-indigo-700 font-mono">[sync_menu id='123']</code> (where 123 is your synchronized Page/Post ID).</li>
                          </ol>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-indigo-100 flex gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs">3</span>
                        <div>
                          <strong className="text-indigo-950 text-xs block">Option C: Drag and Drop the "Post Content" Widget Inside Elementor</strong>
                          <p className="text-indigo-900/80 mt-1">
                            If you still want to design the current page with Elementor, Elementor has a built-in widget that renders the standard page body sync payload.
                          </p>
                          <ol className="list-decimal pl-4 mt-2 space-y-1 text-indigo-950/95 font-medium">
                            <li>Open your page in Elementor.</li>
                            <li>Search your widget panel for <strong className="font-semibold text-indigo-900">Post Content</strong> (commonly called <em>Contenido de la publicación</em> or <em>Contenido del Post</em>).</li>
                            <li>Drag and drop it into your page structure where the menu belongs.</li>
                            <li>Turn on <strong>HTML Comments</strong> mode in our App and click Sync! The comments placeholder will now display beautifully within your Elementor template.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="p-6 bg-gray-50/50 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <input
                    type="text"
                    value={cat.title}
                    onChange={(e) => updateCategoryTitle(cat.id, e.target.value)}
                    className="bg-transparent border-0 font-bold text-gray-900 focus:ring-0 focus:border-b focus:border-indigo-500 p-0 text-base w-full md:w-64"
                    placeholder="Category Name"
                  />
                </div>
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition"
                  title="Remove Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Category-Level Container Target Config */}
              <div id={`target-panel-${cat.id}`} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs flex flex-col md:flex-row md:items-center gap-4 text-xs">
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-gray-700 block text-[10px] uppercase tracking-wider">Precision Container Targeting</span>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={cat.targetSelectorType || 'comments'}
                      onChange={(e) => updateCategorySelector(cat.id, 'targetSelectorType', e.target.value as any)}
                      className="p-1.5 rounded border border-gray-200 bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 scale-95 origin-left"
                    >
                      <option value="comments">HTML Comments</option>
                      <option value="id">CSS Element ID</option>
                      <option value="class">CSS Element Class</option>
                      <option value="placeholder">Text Placeholder</option>
                    </select>
                    
                    <input
                      type="text"
                      value={cat.targetSelectorValue || ''}
                      onChange={(e) => updateCategorySelector(cat.id, 'targetSelectorValue', e.target.value)}
                      placeholder={cat.targetSelectorType === 'comments' ? 'e.g. CHEF_SPECIALITIES' : 'e.g. chef-specialties'}
                      className="p-1 px-2 text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 min-w-[120px]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    {cat.targetSelectorType === 'comments' 
                      ? `Looks for <!-- ${cat.targetSelectorValue || 'SLUG'}_START --> ... <!-- ${cat.targetSelectorValue || 'SLUG'}_END --> inside your Elementor Page.`
                      : cat.targetSelectorType === 'id' 
                        ? `Looks for <div id="${cat.targetSelectorValue || 'slug'}"> ... </div> inside your Elementor Page.`
                        : cat.targetSelectorType === 'class'
                          ? `Looks for <div class="${cat.targetSelectorValue || 'slug'}"> ... </div> inside your Elementor Page.`
                          : `Replaces literal text "${cat.targetSelectorValue || 'slug'}" with this Category container.`
                    }
                  </p>
                </div>

                <div className="shrink-0 flex items-end">
                  <button
                    onClick={() => handleSingleCategorySync(cat)}
                    disabled={loading}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 border border-indigo-200 disabled:opacity-50 text-xs shadow-xs hover:shadow"
                  >
                    <Send className="w-3.5 h-3.5" /> Sync Only This Section
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {cat.items.map((dish) => (
                  <div key={dish.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Dish Name</label>
                        <input
                          type="text"
                          value={dish.name}
                          onChange={(e) => updateDish(cat.id, dish.id, 'name', e.target.value)}
                          className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="e.g. Lobster Bisque"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Price</label>
                        <input
                          type="text"
                          value={dish.price}
                          onChange={(e) => updateDish(cat.id, dish.id, 'price', e.target.value)}
                          className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="e.g. $14.00"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Description</label>
                        <input
                          type="text"
                          value={dish.description}
                          onChange={(e) => updateDish(cat.id, dish.id, 'description', e.target.value)}
                          className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="e.g. Creamy smooth classic French style broth"
                        />
                      </div>
                      <div className="md:col-span-2 pt-6 flex justify-end gap-2">
                        <button
                          onClick={() => updateDish(cat.id, dish.id, 'showTargeting', !dish.showTargeting)}
                          className={`p-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                            dish.showTargeting 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                              : (dish.targetNameType && dish.targetNameType !== 'none') || (dish.targetPriceType && dish.targetPriceType !== 'none')
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 animate-pulse'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Configure Granular Elements Targets on WordPress"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Target Elementor
                        </button>
                        <button
                          onClick={() => removeDish(cat.id, dish.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-gray-50 transition shrink-0"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* COLLAPSIBLE INDIVIDUAL DISH COMPONENT TARGET PANEL */}
                    {dish.showTargeting && (
                      <div className="pt-3 border-t border-gray-150 bg-indigo-50/10 p-3 rounded-lg space-y-3">
                        <div className="flex items-center justify-between border-b border-indigo-100/60 pb-1.5">
                          <span className="font-bold text-indigo-950 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            Granular Elementor Targeting for "{dish.name || 'this dish'}"
                          </span>
                          <button
                            onClick={() => handleSingleDishSync(dish)}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" /> Sync This Item
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Dish Name Target */}
                          <div className="space-y-1">
                            <label className="font-semibold text-gray-700 block text-[10px]">Dish Name Target Container</label>
                            <div className="flex items-center gap-1">
                              <select
                                value={dish.targetNameType || 'none'}
                                onChange={(e) => updateDish(cat.id, dish.id, 'targetNameType', e.target.value)}
                                className="p-1 rounded border border-gray-200 bg-white text-gray-700 text-[11px]"
                              >
                                <option value="none">Disabled (Sync as part of list)</option>
                                <option value="id">CSS ID</option>
                                <option value="class">CSS Class</option>
                                <option value="placeholder">Text Placeholder</option>
                              </select>
                              {dish.targetNameType && dish.targetNameType !== 'none' && (
                                <input
                                  type="text"
                                  value={dish.targetNameValue || ''}
                                  onChange={(e) => updateDish(cat.id, dish.id, 'targetNameValue', e.target.value)}
                                  placeholder="Selector value"
                                  className="p-1 px-1.5 rounded border border-gray-200 text-[11px] focus:ring-1 focus:ring-indigo-500 w-full"
                                />
                              )}
                            </div>
                          </div>

                          {/* Dish Price Target */}
                          <div className="space-y-1">
                            <label className="font-semibold text-gray-700 block text-[10px]">Dish Price Target Container</label>
                            <div className="flex items-center gap-1">
                              <select
                                value={dish.targetPriceType || 'none'}
                                onChange={(e) => updateDish(cat.id, dish.id, 'targetPriceType', e.target.value)}
                                className="p-1 rounded border border-gray-200 bg-white text-gray-700 text-[11px]"
                              >
                                <option value="none">Disabled (Sync as part of list)</option>
                                <option value="id">CSS ID</option>
                                <option value="class">CSS Class</option>
                                <option value="placeholder">Text Placeholder</option>
                              </select>
                              {dish.targetPriceType && dish.targetPriceType !== 'none' && (
                                <input
                                  type="text"
                                  value={dish.targetPriceValue || ''}
                                  onChange={(e) => updateDish(cat.id, dish.id, 'targetPriceValue', e.target.value)}
                                  placeholder="Selector value"
                                  className="p-1 px-1.5 rounded border border-gray-200 text-[11px] focus:ring-1 focus:ring-indigo-500 w-full"
                                />
                              )}
                            </div>
                          </div>

                          {/* Dish Desc Target */}
                          <div className="space-y-1">
                            <label className="font-semibold text-gray-700 block text-[10px]">Dish Description Target Container</label>
                            <div className="flex items-center gap-1">
                              <select
                                value={dish.targetDescType || 'none'}
                                onChange={(e) => updateDish(cat.id, dish.id, 'targetDescType', e.target.value)}
                                className="p-1 rounded border border-gray-200 bg-white text-gray-700 text-[11px]"
                              >
                                <option value="none">Disabled (Sync as part of list)</option>
                                <option value="id">CSS ID</option>
                                <option value="class">CSS Class</option>
                                <option value="placeholder">Text Placeholder</option>
                              </select>
                              {dish.targetDescType && dish.targetDescType !== 'none' && (
                                <input
                                  type="text"
                                  value={dish.targetDescValue || ''}
                                  onChange={(e) => updateDish(cat.id, dish.id, 'targetDescValue', e.target.value)}
                                  placeholder="Selector value"
                                  className="p-1 px-1.5 rounded border border-gray-200 text-[11px] focus:ring-1 focus:ring-indigo-500 w-full"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                          💡 <strong>Setting up independent elements:</strong> When target selector is enabled (e.g. ID for Price), that element is updated directly on WordPress without replacing the rest of the template! You can also click the quick <strong>"Sync This Item"</strong> button to synchronize only this item.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addDish(cat.id)}
                className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-600 border border-dashed border-indigo-200 hover:border-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add New Dish Item
              </button>
            </div>
          ))}

          <button
            onClick={addCategory}
            className="w-full py-3 bg-white hover:bg-gray-50 border border-dashed border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Insert New Menu Section Category
          </button>
        </div>
      </div>
      
      {/* Visual Integration Blueprint Guide */}
      <div className="bg-slate-900 rounded-2xl text-white overflow-hidden shadow-xl border border-slate-800">
        <div className="p-6 sm:p-8 bg-linear-to-r from-indigo-900 to-slate-900 border-b border-slate-800">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Visual Integration Blueprint for Elementor
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Follow this simple guide to orchestrate seamless synchronization directly inside your Elementor Page.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Conceptual Wiring Diagram */}
          <div>
            <span className="font-bold text-indigo-400 text-[10px] uppercase tracking-wider block mb-3">Live Content Injection Concept</span>
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 border border-slate-800/80 leading-relaxed space-y-1 select-none">
              <div className="text-slate-500 text-center text-[10px]">▲ YOUR EXISTING WORDPRESS HEADER (PRESERVED) ▲</div>
              <div className="border-t border-dashed border-slate-800 my-2"></div>
              
              <div className="flex items-center justify-between text-yellow-400/90 font-bold bg-yellow-500/10 p-1.5 px-3 rounded border border-yellow-500/20">
                <span><span>widget</span> ─── &lt;h2&gt;MENU_START&lt;/h2&gt;</span>
                <span className="text-[10px] uppercase font-semibold text-yellow-500">Starts Injection</span>
              </div>
              
              <div className="relative py-4 my-1 flex flex-col items-center justify-center bg-indigo-500/10 rounded border border-indigo-500/20 text-center animate-pulse">
                <span className="font-sans font-extrabold text-sm text-indigo-300">🍽️ Dynamic Generated Menu Section</span>
                <span className="text-[10px] text-indigo-400 mt-1">Inserts all prices, descriptions & dish lists automatically!</span>
              </div>

              <div className="flex items-center justify-between text-yellow-400/90 font-bold bg-yellow-500/10 p-1.5 px-3 rounded border border-yellow-500/20">
                <span><span>widget</span> ─── &lt;p&gt;MENU_END&lt;/p&gt;</span>
                <span className="text-[10px] uppercase font-semibold text-yellow-500">Ends Injection</span>
              </div>

              <div className="border-t border-dashed border-slate-800 my-2"></div>
              <div className="text-slate-500 text-center text-[10px]">▼ YOUR EXISTING WORDPRESS FOOTER (PRESERVED) ▼</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-[11px] font-black flex items-center justify-center">1</span>
                <h4 className="font-bold text-slate-200 text-sm">Set Up in WordPress (Elementor)</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside pl-1 leading-relaxed">
                <li>Open your page in Elementor editor.</li>
                <li>Add a standard <strong className="text-indigo-300">Heading or Text widget</strong> where you want the menu to start and type <code className="bg-slate-950 font-mono text-[10px] px-1 py-0.5 rounded text-white font-bold">MENU_START</code> as its title text.</li>
                <li>Create another Text widget below it and write <code className="bg-slate-950 font-mono text-[10px] px-1 py-0.5 rounded text-white font-bold">MENU_END</code>.</li>
                <li>Save/Update your page in WordPress.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-[11px] font-black flex items-center justify-center">2</span>
                <h4 className="font-bold text-slate-200 text-sm">Synchronize the Menu here</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside pl-1 leading-relaxed">
                <li>Enter your WordPress Site URL and Credentials in the <strong className="text-indigo-300">Settings</strong> page.</li>
                <li>Come back here, build your custom categories or dishes.</li>
                <li>Click the <strong className="text-indigo-300">Publish Test Menu</strong> button in the top right.</li>
                <li>The server will safely update the exact range on your WordPress site!</li>
              </ul>
            </div>
          </div>

          {/* Advanced Info Section */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300/85">
            <div className="space-y-1">
              <h5 className="font-bold text-indigo-300">Need specific categories in separate columns?</h5>
              <p className="leading-relaxed text-[11px]">
                You can configure target indicators for <strong className="text-white">each category</strong> individually. Change the type to Class or Comment, and input a unique text identifier in the field above to sync sections with absolute precision!
              </p>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-indigo-300">Is data secure?</h5>
              <p className="leading-relaxed text-[11px]">
                Yes, your API credentials and page identifiers are stored in your private Firestore path <code className="bg-slate-950 font-mono text-[10px] px-1 py-0.5 rounded text-white">/userConfigs/{auth.currentUser?.uid}</code>. They are transmitted securely to proxy API routes server-side to prevent credential leakage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
