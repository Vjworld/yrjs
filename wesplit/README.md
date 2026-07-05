# WeSplit 🗺️

**Smart Group Travel Expense Manager** — Track, split, and settle group travel expenses with ease. Works offline, syncs to Google Sheets.

[![Deploy to GitHub Pages](https://github.com/badges/shields/raw/master/badges/github_pages.svg)](https://pages.github.com/)

## 🌐 Live Demo
> `https://<your-username>.github.io/<repo-name>/wesplit/`

---

## ✅ Features

| Feature | Status |
|---------|--------|
| Sign Up / Sign In / Forgot Password | ✅ |
| Google OAuth (stub – Firebase ready) | ✅ |
| Create / Edit / Delete Trips | ✅ |
| Add Members with UPI IDs | ✅ |
| Expense Logging with Categories | ✅ |
| Custom On-the-Fly Category Creation | ✅ |
| Smart Debt Minimization Algorithm | ✅ |
| Settlement Matrix with UPI Deep Links | ✅ |
| Google Sheets Sync (Apps Script) | ✅ |
| Offline-First (IndexedDB) | ✅ |
| Auto-sync on Reconnect | ✅ |
| Service Worker / PWA Cache | ✅ |
| Find Trip Mate (Community) | ✅ |
| Find Groups to Join | ✅ |
| Loyalty Coins & Rewards | ✅ |
| Partner Sponsor Listings | ✅ |
| Dark / Light Mode | ✅ |
| Multi-Currency Support | ✅ |
| CSV Export | ✅ |
| Toast Notifications | ✅ |
| Suggest Feature / Bug Report Form | ✅ |
| Contact Us Form | ✅ |
| FAQ Page | ✅ |
| Terms & Privacy Pages | ✅ |
| Responsive / Mobile-first | ✅ |

---

## 🚀 Deployment (GitHub Pages)

### 1. Fork / Push to GitHub
```bash
git clone https://github.com/your-username/wesplit.git
cd wesplit
# Open wesplit/ folder
```

### 2. Enable GitHub Pages
- Go to your repo → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / `master`, folder: `/ (root)` or `/wesplit`
- Save → your site is live at `https://<username>.github.io/<repo>/wesplit/`

### 3. Set Up Google Sheets Sync (Optional)
1. Open [script.google.com](https://script.google.com) → New Project
2. Paste the Apps Script code (from WeSplit → Settings → Google Sheets → Configure)
3. Deploy → Web App (Execute as: Me, Who can access: Anyone)
4. Copy the URL → paste in WeSplit settings

### 4. Custom Domain (Namecheap + Cloudflare)
Add a `CNAME` file in the repo root:
```
wesplit.yourdomain.com
```
Then in Cloudflare DNS, add:
```
CNAME  wesplit  <username>.github.io
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom properties), Vanilla JS (ES6+) |
| Icons | Font Awesome 6 |
| Fonts | Inter + Space Grotesk (Google Fonts) |
| Database | Browser localStorage + IndexedDB |
| Cloud Sync | Google Sheets via Apps Script REST |
| Hosting | GitHub Pages |
| PWA | Service Worker |
| Payments | UPI deep links (GPay, PhonePe, Paytm, BHIM) |

---

## 📁 Project Structure

```
wesplit/
├── index.html              # Main SPA entry point
├── sw.js                   # Service Worker (offline cache)
├── .nojekyll               # GitHub Pages: don't process with Jekyll
├── css/
│   ├── variables.css       # Design tokens (colors, spacing, fonts)
│   ├── base.css            # Reset + utilities
│   ├── components.css      # Reusable UI components
│   ├── app.css             # App layout + page styles
│   └── responsive.css      # Mobile / tablet breakpoints
├── js/
│   ├── config.js           # APP constants, categories, currencies
│   ├── storage.js          # localStorage + IndexedDB + offline queue
│   ├── auth.js             # Sign up/in/out + password strength
│   ├── expenses.js         # Expense CRUD + form builder
│   ├── settlements.js      # Debt minimization algorithm + matrix
│   ├── sheets.js           # Google Sheets sync + Apps Script
│   ├── notifications.js    # Toast system + modal system + notif panel
│   ├── pages.js            # All page renderers (SPA router)
│   └── app.js              # App controller + navigation
├── pages/
│   ├── terms.html          # Terms of Service
│   └── privacy.html        # Privacy Policy
└── assets/
    └── icons/
        └── favicon.svg     # SVG favicon
```

---

## 💰 Monetization Strategy

1. **Sponsored Listings** – Hotels, cafes, activity providers pay to appear in the Sponsors section
2. **Coins → Discount Redemptions** – Partners pay WeSplit when coins are redeemed
3. **Premium Tier** – Future: unlimited trips, advanced analytics, priority support
4. **API Access** – Sell access to anonymized travel spending trends

---

## 🔧 Configuration

Edit `js/config.js` to customize:
- Default expense categories
- Supported currencies
- UPI payment apps
- Coin reward amounts
- Apps Script URL

---

## 📱 PWA Installation

WeSplit is a Progressive Web App. Users can install it on:
- **Android**: Chrome → Add to Home Screen
- **iOS**: Safari → Share → Add to Home Screen
- **Desktop**: Chrome/Edge → Install button in address bar

---

## 📄 License

MIT License – Free to use, fork, and deploy.

---

*Built with ❤️ for group travelers everywhere.*
