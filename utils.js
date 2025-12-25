
// --- LocalStorage Service ---

const STORAGE_KEY = 'adbuilder_campaigns';

export const getCampaigns = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load campaigns", e);
    return [];
  }
};

export const saveCampaign = (campaign) => {
  const campaigns = getCampaigns();
  // Update if exists, else add
  const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
  if (existingIndex >= 0) {
    campaigns[existingIndex] = campaign;
  } else {
    campaigns.push(campaign);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
};

// --- "AI" / Scraper Mock Logic ---

const KEYWORD_MAPPINGS = {
  'salon': { 
    type: 'Beauty Salon', 
    keywords: ['haircut', 'styling', 'beauty salon', 'hair treatment', 'bridal makeup'], 
    emoji: '💇‍♀️',
    competitors: ['cheap haircuts', 'walk-in salon', 'super cuts'],
    differentiate: ['organic hair dye', 'private styling suite', 'celebrity stylist']
  },
  'clinic': { 
    type: 'Medical Clinic', 
    keywords: ['doctor appointment', 'health checkup', 'specialist', 'urgent care', 'medical center'], 
    emoji: '🏥',
    competitors: ['general hospital', 'city clinic', '24h urgent care'],
    differentiate: ['holistic medicine', 'concierge doctor', 'no-wait appointments']
  },
  'dent': { 
    type: 'Dental Clinic', 
    keywords: ['teeth whitening', 'dental implants', 'root canal', 'dentist near me', 'braces'], 
    emoji: '🦷',
    competitors: ['affordable braces', 'family dentistry', 'dental chain'],
    differentiate: ['sedation dentistry', 'painless veneers', 'laser gum treatment']
  },
  'hotel': { 
    type: 'Hotel', 
    keywords: ['luxury rooms', 'hotel booking', 'vacation stay', 'resort', 'accommodation'], 
    emoji: '🏨',
    competitors: ['booking.com', 'expedia', 'cheap motels'],
    differentiate: ['eco-resort', 'pet friendly suites', 'historic boutique']
  },
  'travel': { 
    type: 'Travel Agency', 
    keywords: ['holiday packages', 'flight booking', 'tour guide', 'honeymoon trips', 'adventure travel'], 
    emoji: '✈️',
    competitors: ['tripadvisor', 'cheap flights', 'package deals'],
    differentiate: ['antarctica expeditions', 'culinary tours', 'private jet charter']
  },
  'coach': { 
    type: 'Coaching Center', 
    keywords: ['exam prep', 'online classes', 'tutor', 'skills training', 'certification'], 
    emoji: '🎓',
    competitors: ['udemy', 'coursera', 'khan academy'],
    differentiate: ['1-on-1 mentorship', 'guaranteed placement', 'live workshops']
  },
  'cafe': { 
    type: 'Cafe', 
    keywords: ['coffee shop', 'breakfast', 'pastries', 'latte art', 'cozy cafe'], 
    emoji: '☕',
    competitors: ['starbucks', 'dunkin', 'mcdonalds coffee'],
    differentiate: ['single origin beans', 'cat cafe', 'vegan bakery']
  },
  'food': { 
    type: 'Restaurant', 
    keywords: ['dining', 'food delivery', 'gourmet', 'family restaurant', 'local cuisine'], 
    emoji: '🍽️',
    competitors: ['uber eats', 'doordash', 'fast food'],
    differentiate: ['farm to table', 'molecular gastronomy', 'chef\'s table']
  },
  'pizza': { 
    type: 'Pizza Place', 
    keywords: ['pepperoni', 'cheese pizza', 'delivery', 'slice', 'italian food'], 
    emoji: '🍕',
    competitors: ['dominos', 'pizza hut', 'papa johns'],
    differentiate: ['wood fired', 'authentic napolitan', 'gluten free cauliflower crust']
  },
  'law': { 
    type: 'Legal Services', 
    keywords: ['lawyer', 'legal advice', 'attorney', 'consultation', 'litigation'], 
    emoji: '⚖️',
    competitors: ['legalzoom', 'public defender', 'legal aid'],
    differentiate: ['boutique litigation', 'international ip law', 'high net worth estate']
  },
};

const DEFAULT_TYPE = { 
  type: 'Local Business', 
  keywords: ['best service', 'near me', 'affordable', 'top rated', 'professional'], 
  emoji: '🏢',
  competitors: ['big chain store', 'online marketplace', 'discount services'],
  differentiate: ['handcrafted', 'family owned since 1980', 'premium concierge']
};

export const generateSuggestionsFromUrl = (url, businessName, city, tone = 'Neutral') => {
  const lowerUrl = url ? url.toLowerCase() : '';
  
  // 1. Detect Business Type
  let detected = DEFAULT_TYPE;
  let confidence = 'Low';
  
  // Check specific keys first
  for (const key in KEYWORD_MAPPINGS) {
    if (lowerUrl.includes(key)) {
      detected = KEYWORD_MAPPINGS[key];
      confidence = 'High';
      break;
    }
  }

  // Fallback noun extraction logic (simple splitting) if default
  let extractedNoun = '';
  let domain = url;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = urlObj.hostname;
    const parts = domain.split('.');
    const mainPart = parts.length > 2 ? parts[1] : parts[0];
    
    if (detected === DEFAULT_TYPE) {
      if (mainPart.includes('shop')) { extractedNoun = 'Shop'; detected = { ...DEFAULT_TYPE, type: 'Shop' }; confidence = 'Med'; }
      else if (mainPart.includes('tech')) { extractedNoun = 'Tech'; detected = { ...DEFAULT_TYPE, type: 'Tech Services' }; confidence = 'Med'; }
      else { extractedNoun = mainPart.charAt(0).toUpperCase() + mainPart.slice(1); }
    }
  } catch (e) {
    extractedNoun = 'Service';
  }

  const businessType = detected.type;
  const keywords = [...detected.keywords];

  // 2. Generate Ad Copies based on Tone
  const locationText = city ? ` in ${city}` : '';
  const nameText = businessName || (extractedNoun || 'Us');

  // Tone modifiers
  const prefixes = {
    'Neutral': ['Best', 'Top Rated', 'Quality'],
    'Premium': ['Exclusive', 'Luxury', 'Premium'],
    'Affordable': ['Affordable', 'Cheap', 'Best Value'],
    'Urgent': ['Hurry', 'Last Chance', 'Limited Time'],
    'Friendly': ['Welcome to', 'Your Neighborhood', 'Friendly'],
  };

  const descriptions = {
    'Neutral': `Visit ${nameText} for top-rated service. Book your appointment or order online today!`,
    'Premium': `Experience the finest ${businessType} services. Unmatched quality and attention to detail.`,
    'Affordable': `Get premium quality at prices you'll love. Save big with ${nameText} today.`,
    'Urgent': `Don't miss out! Special offers on ${businessType} services end soon. Book now!`,
    'Friendly': `We love our customers! Come visit ${nameText} for a warm and welcoming experience.`
  };

  const adCopies = [
    {
      headline: `${prefixes[tone][0]} ${businessType}${locationText}`,
      description: descriptions[tone]
    },
    {
      headline: `${detected.emoji} ${prefixes[tone][1]} ${businessType}`,
      description: `Looking for quality? We offer the best experience. Click to learn more.`
    },
    {
      headline: `${prefixes[tone][2]} ${businessType} Services`,
      description: `See why everyone is talking about ${nameText}. Satisfaction guaranteed.`
    }
  ];

  // 3. Creative/Policy Checks
  const score = (str) => str.length % 3;
  const levels = ['Low', 'Med', 'High'];
  
  const checks = {
    cta: levels[score(url || '')],
    brand: levels[score(businessType)],
    policy: 'Low',
  };

  const isSocial = domain.includes('facebook.com') || domain.includes('instagram.com') || domain.includes('linkedin.com');
  
  // Snapshot
  const snapshot = {
    domain: domain,
    category: businessType,
    confidence: confidence,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    isSocial
  };

  return {
    businessType,
    keywords,
    adCopies,
    checks,
    landingPage: url,
    detectedName: extractedNoun,
    snapshot,
    competitorTerms: detected.competitors,
    differentiateTerms: detected.differentiate
  };
};

export const calculateEstimates = (sliderValue, objective) => {
  // Slider 0 (Volume) -> 100 (Efficiency)
  
  const factor = sliderValue / 100;

  let maxVisitors = 1000;
  let minVisitors = 200;
  let minCpl = 150; 
  let maxCpl = 800;

  // Adjust base stats based on objective for realism
  if (objective === 'online_sales') {
     maxVisitors = 500; minVisitors = 50; // Harder to get sales
     minCpl = 500; maxCpl = 2500; // Cost per acquisition higher
  } else if (objective === 'get_calls') {
     maxVisitors = 300; minVisitors = 80;
     minCpl = 200; maxCpl = 1200;
  }

  // Linear interpolation
  const estVisitorsBase = maxVisitors - ((maxVisitors - minVisitors) * factor);
  const estCplBase = minCpl + ((maxCpl - minCpl) * factor);

  // Add some randomness/range
  const vRange = Math.floor(estVisitorsBase * 0.1);
  const cRange = Math.floor(estCplBase * 0.1);

  return {
    visitorsMin: Math.floor(estVisitorsBase - vRange),
    visitorsMax: Math.floor(estVisitorsBase + vRange),
    cplMin: Math.floor(estCplBase - cRange),
    cplMax: Math.floor(estCplBase + cRange),
  };
};
