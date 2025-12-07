# Deployment & Updates Guide 🚀

Yes! You can update your site **as many times as you want**. Releasing is not final.

## How to Update Your Live Site
Whenever you make changes to the code (or I make them for you):

1.  **Build the Project**:
    *   Command: `npm run build`
    *   (I can usually do this step for you)

2.  **Upload the Update**:
    *   Open your specific site on Netlify (in your dashboard).
    *   Find the **"Deploys"** tab.
    *   Drag the **`dist`** folder (from `C:\Users\Jacke\OneDrive\Skrivbord\Ai 1\dist`) onto the drop zone.

**That's it!** The site updates instantly. Your URL stays the same.

## Why this is safe
*   Netlify keeps a history of all versions.
*   If you break something, you can one-click "Rollback" to the previous version in the Deploys tab.

## Custom Domains (.com / .app) 🌐
**No, deploying now does NOT stop you from getting a .com later!**

In fact, it's the perfect first step.
1.  **Buy your domain** (from Namecheap, GoDaddy, etc.).
2.  Go to your **Netlify Dashboard**.
3.  Click **"Domain Management"** -> **"Add Custom Domain"**.
4.  Type `singersdreams.app` (or whatever you bought).

Netlify will connect them automatically. You don't need to rebuild the site. Start with the free link, upgrade to `.com` whenever you're ready!
