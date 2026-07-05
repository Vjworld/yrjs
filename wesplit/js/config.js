/* ============================================================
   YRJS – Global Configuration & Constants
   ============================================================ */
'use strict';

const APP = {
  name:    'YRJS',
  version: '1.0.0',
  tagline: 'Your Journey, Simplified',

  /* --------------- Expense Categories --------------- */
  defaultCategories: [
    { id: 'food',       label: 'Food & Dining',    icon: '🍽️',  color: '#f59e0b', bg: '#fef3c7' },
    { id: 'travel',     label: 'Travel / Transport',icon: '✈️',  color: '#3b82f6', bg: '#dbeafe' },
    { id: 'ride',       label: 'Ride / Cab',        icon: '🚕',  color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'hotel',      label: 'Accommodation',     icon: '🏨',  color: '#10b981', bg: '#d1fae5' },
    { id: 'activities', label: 'Activities / Entry',icon: '🎡',  color: '#ef4444', bg: '#fee2e2' },
    { id: 'shopping',   label: 'Shopping',          icon: '🛍️', color: '#ec4899', bg: '#fce7f3' },
    { id: 'fuel',       label: 'Fuel',              icon: '⛽',  color: '#64748b', bg: '#f1f5f9' },
    { id: 'medical',    label: 'Medical / Safety',  icon: '🏥',  color: '#dc2626', bg: '#fee2e2' },
    { id: 'tips',       label: 'Tips & Misc',       icon: '💰',  color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'ropeway',    label: 'Ropeway / Cable car',icon: '🚡', color: '#7c3aed', bg: '#ede9fe' },
    { id: 'other',      label: 'Other',             icon: '📦',  color: '#94a3b8', bg: '#f1f5f9' },
  ],

  /* --------------- Currencies --------------- */
  currencies: [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$',name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$',name: 'Canadian Dollar' },
  ],

  /* --------------- UPI Payment Apps --------------- */
  upiApps: [
    { id: 'gpay',    name: 'GPay',    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png',    scheme: 'gpay' },
    { id: 'phonepe', name: 'PhonePe', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png', scheme: 'phonepe' },
    { id: 'paytm',   name: 'Paytm',   icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png',   scheme: 'paytm' },
    { id: 'bhim',    name: 'BHIM',    icon: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/BHIM_logo.svg/512px-BHIM_logo.svg.png',    scheme: 'upi' },
  ],

  /* --------------- Coin Rewards --------------- */
  coins: {
    addExpense:  5,
    sheetsSync:  20,
    signUp:      50,
    tripCreated: 10,
    inviteFriend: 25,
  },

  /* --------------- Google Sheets App Script URL --------------- */
  // Replace with your own deployed Apps Script Web App URL
  appsScriptUrl: '',

  /* --------------- Color palette for charts --------------- */
  chartColors: ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#64748b'],
};

/* Trip cover gradients */
APP.tripCovers = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#84fab0,#8fd3f4)',
  'linear-gradient(135deg,#d4fc79,#96e6a1)',
  'linear-gradient(135deg,#f6d365,#fda085)',
];

/* Sample community data */
APP.sampleMates = [
  { id: 'm1', name: 'Priya S.',   age: 26, city: 'Mumbai',    destinations: ['Ladakh','Goa'],       interests: ['hiking','photography'], avatar: 'P', verified: true  },
  { id: 'm2', name: 'Arjun K.',   age: 30, city: 'Bangalore', destinations: ['Europe','Manali'],     interests: ['cycling','food'],        avatar: 'A', verified: false },
  { id: 'm3', name: 'Riya M.',    age: 24, city: 'Delhi',     destinations: ['Rajasthan','Kerala'],  interests: ['culture','yoga'],        avatar: 'R', verified: true  },
  { id: 'm4', name: 'Sam T.',     age: 28, city: 'Chennai',   destinations: ['Andaman','Sri Lanka'], interests: ['diving','backpacking'],  avatar: 'S', verified: true  },
  { id: 'm5', name: 'Meena L.',   age: 32, city: 'Pune',      destinations: ['Uttarakhand','Nepal'], interests: ['trekking','wildlife'],   avatar: 'M', verified: false },
  { id: 'm6', name: 'Vikram B.',  age: 27, city: 'Hyderabad', destinations: ['Thailand','Bali'],    interests: ['food','nightlife'],      avatar: 'V', verified: true  },
];

APP.sampleGroups = [
  { id: 'g1', name: 'Manali Winter Trek',    destination: 'Manali, HP',     dates: 'Dec 20–27',  members: 4, slots: 2, budget: '₹15,000', organizer: 'Rahul D.',  emoji: '🏔️',  tags: ['trekking','snow','offroad'] },
  { id: 'g2', name: 'Goa Beach Hopping',     destination: 'Goa',            dates: 'Jan 5–10',   members: 6, slots: 2, budget: '₹12,000', organizer: 'Sneha P.',  emoji: '🏖️',  tags: ['beach','party','nightlife'] },
  { id: 'g3', name: 'Rajasthan Heritage',    destination: 'Jaipur – Jodhpur', dates: 'Feb 1–8',  members: 3, slots: 3, budget: '₹20,000', organizer: 'Arun S.',   emoji: '🕌',  tags: ['heritage','culture','desert'] },
  { id: 'g4', name: 'Andaman Islands Dive',  destination: 'Port Blair',     dates: 'Mar 10–17',  members: 5, slots: 1, budget: '₹35,000', organizer: 'Divya K.',  emoji: '🤿',  tags: ['diving','islands','snorkeling'] },
  { id: 'g5', name: 'Kerala Backwaters',     destination: 'Alleppey, Kerala', dates: 'Jan 20–25',members: 4, slots: 2, budget: '₹18,000', organizer: 'Mathew J.', emoji: '⛵',  tags: ['houseboats','ayurveda','nature'] },
  { id: 'g6', name: 'Spiti Valley Offroad',  destination: 'Spiti, HP',      dates: 'Jun 5–14',   members: 3, slots: 3, budget: '₹28,000', organizer: 'Kabir N.',  emoji: '🚙',  tags: ['offroad','mountains','camping'] },
];
