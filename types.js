
export const OBJECTIVES_CONFIG = {
  'website_visits': { 
    label: 'Website Visits', 
    icon: 'Globe', 
    outcomeLabel: 'More Visitors ↔ Higher-Intent Visitors',
    efficiencyLabel: 'Est. cost per visit',
    unit: 'visit'
  },
  'online_sales': { 
    label: 'Online Sales', 
    icon: 'ShoppingCart', 
    outcomeLabel: 'More Orders ↔ Lower Cost per Order',
    efficiencyLabel: 'Est. cost per order',
    unit: 'order'
  },
  'get_calls': { 
    label: 'Get Calls', 
    icon: 'Phone', 
    outcomeLabel: 'More Leads ↔ Better Quality Leads',
    efficiencyLabel: 'Est. cost per inquiry',
    unit: 'inquiry'
  },
  'whatsapp_leads': { 
    label: 'WhatsApp Leads', 
    icon: 'MessageCircle', 
    outcomeLabel: 'More Leads ↔ Better Quality Leads',
    efficiencyLabel: 'Est. cost per inquiry',
    unit: 'inquiry'
  },
  'store_visits': { 
    label: 'Store Visits', 
    icon: 'MapPin', 
    outcomeLabel: 'More Footfall ↔ More Ready-to-buy',
    efficiencyLabel: 'Est. cost per store visit',
    unit: 'store visit'
  },
};

export const OBJECTIVES = Object.keys(OBJECTIVES_CONFIG).map(key => ({ id: key, ...OBJECTIVES_CONFIG[key] }));

export const INITIAL_CAMPAIGN_STATE = {
  id: '',
  createdAt: '',
  name: '',
  status: 'Draft',
  objective: '',
  url: '',
  businessName: '',
  city: '',
  landingPage: '',
  keywordThemes: [],
  adCopies: [],
  tone: 'Neutral',
  checks: { cta: 'Med', brand: 'Med', policy: 'Low' },
  goalSlider: 50,
  estimates: { visitorsMin: 0, visitorsMax: 0, cplMin: 0, cplMax: 0 },
  strategy: 'none',
};
