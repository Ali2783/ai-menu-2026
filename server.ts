import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Load Firebase configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase Admin with target project identifier to resolve the verification audience mismatch
const adminApp = admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // API routes
  app.post("/api/extract-menu", async (req, res) => {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).send("No image data provided.");
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing on the server! Please verify it in Settings.");
      return res.status(500).send("GEMINI_API_KEY environment variable is not configured. Please add it in your AI Studio project Settings > Secrets panel.");
    }

    try {
      console.log("Analyzing menu image on the server using Gemini AI...");
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1] || base64Image,
        },
      };

      const prompt = `Extract all food menu items from the attached image and return a JSON object in this exact format:
{
  "categories": [
    {
      "id": "string",
      "title": "string",
      "items": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "price": "string"
        }
      ]
    }
  ]
}
Ensure all IDs are unique string identifiers, and prices are accurately extracted.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          price: { type: Type.STRING },
                        },
                        required: ["id", "name", "description", "price"]
                      }
                    }
                  },
                  required: ["id", "title", "items"]
                }
              }
            },
            required: ["categories"]
          }
        }
      });

      console.log("Gemini extraction complete.");
      if (!response.text) {
        throw new Error("No text response received from Gemini.");
      }

      const menuData = JSON.parse(response.text);
      res.json(menuData);
    } catch (err: any) {
      console.error("Gemini server-side extraction error:", err);
      res.status(500).send(err.message || "Failed to extract menu using Gemini AI.");
    }
  });

  app.post("/api/sync-wordpress", async (req, res) => {
    const authHeader = req.headers.authorization;
    let uid = 'admin_local';
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedUser = await admin.auth().verifyIdToken(token);
        uid = decodedUser.uid;
      } catch (err: any) {
        console.warn('Firebase token verification passed over as optional:', err.message || err);
      }
    }
    
    try {
      // Securely fetch config from payload or fallback to db
      let config = req.body.wordpressConfig;
      if (!config) {
        try {
          const doc = await db.collection('userConfigs').doc(uid).get();
          if (doc.exists) {
            config = doc.data();
          }
        } catch (dbErr: any) {
          console.warn("Could not read backup config from Firestore Admin SDK:", dbErr.message || dbErr);
        }
      }

      const { siteUrl, username, applicationPassword, targetPageId } = config || {};

      if (!siteUrl || !username || !applicationPassword) {
        return res.status(400).send('WordPress configuration is incomplete. Please complete all fields in Settings.');
      }

      if (!targetPageId) {
        return res.status(400).send('Please configure a Target Page ID in WordPress Settings to sync.');
      }

      const { menuData, singleCategory, syncModeOverride, customSelectorOverride, actions } = req.body;
      console.log(`Syncing ${singleCategory ? `single category "${singleCategory.title}"` : (actions ? `${actions.length} individual actions` : 'full menu')} to WordPress Page ID ${targetPageId} at ${siteUrl}`);

      // Generate clean and beautifully structured HTML content matching the menu data
      let htmlContent = "";

      if (singleCategory) {
        // Build beautiful HTML for JUST this targeted category container
        htmlContent += `<div class="menu-category" style="margin-bottom: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">`;
        htmlContent += `<div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #4f46e5; margin-bottom: 1.5rem; padding-bottom: 0.5rem;">`;
        htmlContent += `<h2 style="margin: 0; font-size: 1.5rem; color: #4f46e5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${singleCategory.title}</h2>`;
        htmlContent += `</div>`;

        if (singleCategory.items && Array.isArray(singleCategory.items)) {
          htmlContent += `<div class="menu-items" style="display: flex; flex-direction: column; gap: 1.25rem;">`;
          for (const item of singleCategory.items) {
            htmlContent += `<div class="menu-item" style="border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem;">`;
            htmlContent += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">`;
            htmlContent += `<h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827; text-align: left;">${item.name}</h3>`;
            if (item.price) {
              htmlContent += `<span style="font-weight: 700; color: #4b5563; font-size: 1rem;">${item.price}</span>`;
            }
            htmlContent += `</div>`;
            if (item.description) {
              htmlContent += `<p style="margin: 0; font-size: 0.95rem; color: #6b7280; text-align: left;">${item.description}</p>`;
            }
            htmlContent += `</div>`;
          }
          htmlContent += `</div>`;
        }
        htmlContent += `</div>`;
      } else if (!actions) {
        // Build FULL menu HTML
        htmlContent += `<div class="restaurant-menu" style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5;">`;
        htmlContent += `<h1 style="text-align: center; margin-bottom: 2rem; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; font-size: 2.25rem; font-weight: 800;">Our Menu</h1>`;
        
        if (menuData?.categories && Array.isArray(menuData.categories)) {
          for (const cat of menuData.categories) {
            const price = menuData.categoryPrices?.[cat.id] || "";
            htmlContent += `<div class="menu-category" style="margin-bottom: 3rem;">`;
            htmlContent += `<div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #4f46e5; margin-bottom: 1.5rem; padding-bottom: 0.5rem;">`;
            htmlContent += `<h2 style="margin: 0; font-size: 1.5rem; color: #4f46e5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${cat.title}</h2>`;
            if (price) {
              htmlContent += `<span style="font-size: 1.25rem; font-weight: 800; color: #111827; background-color: #f3f4f6; padding: 0.25rem 0.75rem; rounded: 0.375rem;">${price}</span>`;
            }
            htmlContent += `</div>`;
            
            if (cat.items && Array.isArray(cat.items)) {
              htmlContent += `<div class="menu-items" style="display: flex; flex-direction: column; gap: 1.25rem;">`;
              for (const item of cat.items) {
                htmlContent += `<div class="menu-item" style="border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem;">`;
                htmlContent += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">`;
                htmlContent += `<h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827; text-align: left;">${item.name}</h3>`;
                if (item.price) {
                  htmlContent += `<span style="font-weight: 700; color: #4b5563; font-size: 1rem;">${item.price}</span>`;
                }
                htmlContent += `</div>`;
                if (item.description) {
                  htmlContent += `<p style="margin: 0; font-size: 0.95rem; color: #6b7280; text-align: left;">${item.description}</p>`;
                }
                htmlContent += `</div>`;
              }
              htmlContent += `</div>`;
            }
            htmlContent += `</div>`;
          }
        }
        htmlContent += `</div>`;
      }

      // Normalize WordPress site URL and construct endpoint
      let cleanUrl = siteUrl.trim();
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
      }
      const apiEndpoint = `${cleanUrl}/wp-json/wp/v2/pages/${targetPageId.trim()}`;

      // Construct Basic Auth token securely server-side
      const basicAuth = Buffer.from(`${username.trim()}:${applicationPassword.trim()}`).toString('base64');

      let finalContentToSave = htmlContent;
      const isSelective = actions || (syncModeOverride || config.syncMode || 'comments') !== 'full';

      if (isSelective) {
        console.log(`Selective or Action-based publishing selected. Fetching existing content of page ID ${targetPageId}...`);
        const getResponse = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`
          }
        });

        if (!getResponse.ok) {
          const errBody = await getResponse.text();
          console.error(`Failed to fetch current page:`, errBody);
          return res.status(getResponse.status).send(`Failed to read the existing WordPress page before partial update: ${getResponse.statusText || 'Unknown error'}`);
        }

        const pageData = await getResponse.json();
        const existingContent = pageData.content?.raw || pageData.content?.rendered || '';
        finalContentToSave = existingContent;

        if (actions && Array.isArray(actions)) {
          // Process cheerio for all ID and Class based actions together on the page
          const isDocument = existingContent.includes('<html') || existingContent.includes('<body');
          const $ = cheerio.load(existingContent, {}, isDocument);
          let cheerioModified = false;

          for (const action of actions) {
            const mode = action.mode;
            const selector = (action.selector || '').trim();
            const content = action.content || '';

            if (!selector) continue;

            if (mode === 'id' || mode === 'class') {
              let query = '';
              if (mode === 'id') {
                query = selector.startsWith('#') || selector.startsWith('.') || selector.startsWith('[') ? selector : `#${selector}`;
              } else {
                query = selector.startsWith('#') || selector.startsWith('.') || selector.startsWith('[') ? selector : `.${selector}`;
              }

              let matchedElement = $(query);
              if (matchedElement.length === 0) {
                const cleanSelector = selector.replace(/[#.[\]]/g, '').trim();
                const fallbackQuery = `[data-id="${cleanSelector}"]`;
                const fallbackMatch = $(fallbackQuery);
                if (fallbackMatch.length > 0) {
                  matchedElement = fallbackMatch;
                  query = fallbackQuery;
                }
              }

              if (matchedElement.length > 0) {
                matchedElement.html(content);
                cheerioModified = true;
                console.log(`Action updated "${query}" element with custom content.`);
              } else {
                return res.status(400).send(`Target container matching selector "${selector}" (using CSS ${mode === 'id' ? 'ID' : 'Class'}) was not found inside your WordPress page HTML content.\n\nPlease go to Elementor, select that specific column/text widget, and set its CSS ID or Class to "${selector}" under the "Advanced" tab, then click publish and sync again.`);
              }
            } else if (mode === 'comments') {
              const startSelector = `${selector}_START`;
              const endSelector = `${selector}_END`;
              
              const startPattern = `(?:<!--\\s*${startSelector}\\s*-->|<[a-zA-Z0-9]+[^>]*>(?:<[^>]*>)*\\s*${startSelector}\\s*(?:<\\/[^>]*>)*<\\/[a-zA-Z0-9]+>|${startSelector})`;
              const endPattern = `(?:<!--\\s*${endSelector}\\s*-->|<[a-zA-Z0-9]+[^>]*>(?:<[^>]*>)*\\s*${endSelector}\\s*(?:<\\/[^>]*>)*<\\/[a-zA-Z0-9]+>|${endSelector})`;
              const regex = new RegExp(`(${startPattern})([\\s\\S]*?)(${endPattern})`, 'i');

              if (regex.test(finalContentToSave)) {
                finalContentToSave = finalContentToSave.replace(regex, `$1\n${content}\n$3`);
              } else {
                return res.status(400).send(`Target start/end indicators "${startSelector}" / "${endSelector}" were not found inside your WordPress page.`);
              }
            } else if (mode === 'placeholder') {
              if (finalContentToSave.includes(selector)) {
                finalContentToSave = finalContentToSave.split(selector).join(content);
              } else {
                return res.status(400).send(`The text placeholder "${selector}" was not found inside your page.`);
              }
            }
          }

          if (cheerioModified) {
            finalContentToSave = $.html();
          }

        } else {
          // Standard single item fallback mode (existing single selector fallback)
          const mode = syncModeOverride || config.syncMode || 'comments';
          const selector = (customSelectorOverride || config.customSelector || 'menu-container').trim();

          if (mode === 'comments') {
            const isCustomComment = selector !== 'menu-container';
            const startSelector = isCustomComment ? `${selector}_START` : 'MENU_START';
            const endSelector = isCustomComment ? `${selector}_END` : 'MENU_END';
            
            const startPattern = `(?:<!--\\s*${startSelector}\\s*-->|<[a-zA-Z0-9]+[^>]*>(?:<[^>]*>)*\\s*${startSelector}\\s*(?:<\\/[^>]*>)*<\\/[a-zA-Z0-9]+>|${startSelector})`;
            const endPattern = `(?:<!--\\s*${endSelector}\\s*-->|<[a-zA-Z0-9]+[^>]*>(?:<[^>]*>)*\\s*${endSelector}\\s*(?:<\\/[^>]*>)*<\\/[a-zA-Z0-9]+>|${endSelector})`;
            const regex = new RegExp(`(${startPattern})([\\s\\S]*?)(${endPattern})`, 'i');

            if (regex.test(existingContent)) {
              finalContentToSave = existingContent.replace(regex, `$1\n${htmlContent}\n$3`);
            } else {
              const hasStart = existingContent.toLowerCase().includes(startSelector.toLowerCase());
              const hasEnd = existingContent.toLowerCase().includes(endSelector.toLowerCase());
              
              if (hasStart && !hasEnd) {
                return res.status(400).send(`We found your start indicator "${startSelector}" on the page, but could not detect your end indicator "${endSelector}". Please add "${endSelector}" in a text or heading widget where the menu should stop.`);
              } else if (!hasStart && hasEnd) {
                return res.status(400).send(`We found your end indicator "${endSelector}" on the page, but could not detect your start indicator "${startSelector}". Please add "${startSelector}" in a heading or text widget where the menu should start.`);
              } else {
                return res.status(400).send(`WordPress Update Failed: We could not find the target indicators "${startSelector}" and "${endSelector}" in your page's HTML content. 

To resolve this in Elementor:
1. Add a Heading or Text widget in your page editor and type "${startSelector}" as its content.
2. Underneath, add another widget containing your placeholder or content.
3. Write "${endSelector}" in a third widget where you want the menu to end.
Once saved in Elementor, click sync here again!`);
              }
            }
          } else if (mode === 'id' || mode === 'class') {
            const isDocument = existingContent.includes('<html') || existingContent.includes('<body');
            const $ = cheerio.load(existingContent, {}, isDocument);
            
            let query = '';
            if (mode === 'id') {
              query = selector.startsWith('#') || selector.startsWith('.') || selector.startsWith('[') ? selector : `#${selector}`;
            } else {
              query = selector.startsWith('#') || selector.startsWith('.') || selector.startsWith('[') ? selector : `.${selector}`;
            }

            let matchedElement = $(query);
            if (matchedElement.length === 0) {
              const cleanSelector = selector.replace(/[#.[\]]/g, '').trim();
              const fallbackSelector = `[data-id="${cleanSelector}"]`;
              const fallbackMatch = $(fallbackSelector);
              if (fallbackMatch.length > 0) {
                matchedElement = fallbackMatch;
                query = fallbackSelector;
              }
            }

            if (matchedElement.length > 0) {
              matchedElement.html(htmlContent);
              finalContentToSave = $.html();
            } else {
              const suggestions: string[] = [];
              $('[id]').slice(0, 6).each(function() {
                const cid = $(this).attr('id');
                if (cid && !cid.startsWith('elementor-')) {
                  suggestions.push(`#${cid}`);
                }
              });
              $('[data-id]').slice(0, 6).each(function() {
                const dataId = $(this).attr('data-id');
                if (dataId) {
                  suggestions.push(`Elementor Card Code: ${dataId}`);
                }
              });

              const suggestionsBlock = suggestions.length > 0 
                ? `\n\nDetected containers on your page that you can target:\n` + suggestions.map(s => ` - ${s}`).join('\n')
                : '';

              return res.status(400).send(`Target container matching "${query}" was not found inside your WordPress page HTML config.${suggestionsBlock}\n\nTo configure in Elementor:\n1. Click your Menu Container\n2. Go to Advanced -> CSS ID\n3. Type "${selector}" and click publish in WordPress.\n4. Click "Sync" here!`);
            }
          } else if (mode === 'placeholder') {
            if (existingContent.includes(selector)) {
              finalContentToSave = existingContent.replace(selector, `<!-- MENU_START -->\n${htmlContent}\n<!-- MENU_END -->`);
            } else {
              return res.status(400).send(`The search text pattern / placeholder "${selector}" was not found in your page HTML. Please edit the page and write "${selector}".`);
            }
          }
        }
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          content: finalContentToSave
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WordPress REST API error response:', errorText);
        return res.status(response.status).send(`WordPress API Error: ${response.statusText || 'Unable to update page.'}`);
      }

      const responseData = await response.json();
      res.json({ success: true, message: `Menu updated successfully on Page ID ${targetPageId}!`, url: responseData.link });
    } catch (e) {
      console.error(e);
      res.status(500).send('Error syncing to WordPress');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
