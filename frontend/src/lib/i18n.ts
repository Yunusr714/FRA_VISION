import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.atlas': '3D FRA Atlas',
      'nav.claims': 'Claims',
      'nav.tasks': 'Tasks',
      'nav.alerts': 'Alerts',
      'nav.reports': 'Reports',
      'nav.planning': 'Planning',
      'nav.admin': 'Admin',
      'nav.help': 'Help',
      'nav.logout': 'Logout',
      
      // Common
      'common.loading': 'Loading...',
      'common.submit': 'Submit',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.download': 'Download',
      // Auth
      'auth.login': 'Login',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.loginDemo': 'Login as Demo User',
      'auth.welcome': 'Welcome to FRA Atlas',
      
      // Claims
      'claims.title': 'Forest Rights Claims',
      'claims.new': 'New Claim',
      'claims.status.pending': 'Pending',
      'claims.status.approved': 'Approved',
      'claims.status.rejected': 'Rejected',
      'claims.status.underVerification': 'Under Verification',
      'claims.trackingId': 'Tracking ID',
      'claims.claimant': 'Claimant',
      'claims.village': 'Village',
      'claims.area': 'Area (hectares)',
      'claims.submittedOn': 'Submitted On',
      
      // ELI5 explanations
      'eli5.dashboard': 'This shows important numbers about forest rights claims. Think of it like a report card.',
      'eli5.claims': 'These are requests from tribal people asking for rights to their traditional forest land.',
      'eli5.atlas': 'This is a special map that shows forest land and claims in 3D, like looking at the land from above.',
      'eli5.pending': 'These claims are waiting for someone to review them.',
      'eli5.approved': 'These claims have been accepted - the people can use their land.',
      'eli5.rejected': 'These claims were not accepted - usually because papers were missing.',
      
      // Landing page
      'landing.hero.title': 'We protect tribal land rights — fast, fair, and transparent',
      'landing.hero.subtitle': 'AI-powered Forest Rights Act Atlas & Decision Support System',
      'landing.cta.submitClaim': 'Submit a Claim',
      'landing.cta.trackClaim': 'Track My Claim',
      'landing.cta.learnMore': 'What is FRA?'
    }
  },
   hi: {
    translation: {
      // Navigation
      'nav.dashboard': 'डैशबोर्ड',
      'nav.atlas': '3D वन अधिकार एटलस',
      'nav.claims': 'दावे',
      'nav.tasks': 'कार्य',
      'nav.alerts': 'अलर्ट',
      'nav.reports': 'रिपोर्ट',
      'nav.planning': 'योजना',
      'nav.admin': 'प्रशासन',
      'nav.help': 'सहायता',
      'nav.logout': 'लॉगआउट',
      
      // Common
      'common.loading': 'लोड हो रहा है...',
      'common.submit': 'जमा करें',
      'common.cancel': 'रद्द करें',
      'common.save': 'सेव करें',
      'common.edit': 'संपादित करें',
      'common.delete': 'हटाएं',
      'common.view': 'देखें',
      'common.search': 'खोजें',
      'common.filter': 'फिल्टर',
      'common.export': 'निर्यात',
      'common.download': 'डाउनलोड',
      
      // Auth
      'auth.login': 'लॉगिन',
      'auth.username': 'उपयोगकर्ता नाम',
      'auth.password': 'पासवर्ड',
      'auth.loginDemo': 'डेमो उपयोगकर्ता के रूप में लॉगिन करें',
      'auth.welcome': 'वन अधिकार एटलस में आपका स्वागत है',
      
      // Claims
      'claims.title': 'वन अधिकार दावे',
      'claims.new': 'नया दावा',
      'claims.status.pending': 'लंबित',
      'claims.status.approved': 'स्वीकृत',
      'claims.status.rejected': 'अस्वीकृत',
      'claims.status.underVerification': 'सत्यापन के तहत',
      'claims.trackingId': 'ट्रैकिंग आईडी',
      'claims.claimant': 'दावेदार',
      'claims.village': 'गांव',
      'claims.area': 'क्षेत्रफल (हेक्टेयर)',
      'claims.submittedOn': 'जमा किया गया',
      // ELI5 explanations
      'eli5.dashboard': 'यह वन अधिकार दावों के बारे में महत्वपूर्ण संख्याएं दिखाता है।',
      'eli5.claims': 'ये आदिवासी लोगों के अनुरोध हैं जो अपनी पारंपरिक वन भूमि के अधिकार मांग रहे हैं।',
      'eli5.atlas': 'यह एक विशेष नक्शा है जो वन भूमि और दावों को 3D में दिखाता है।',
      'eli5.pending': 'ये दावे किसी की समीक्षा का इंतज़ार कर रहे हैं।',
      'eli5.approved': 'ये दावे स्वीकार किए गए हैं - लोग अपनी भूमि का उपयोग कर सकते हैं।',
      'eli5.rejected': 'ये दावे स्वीकार नहीं किए गए - आमतौर पर कागजात गुम थे।',
      
      // Landing page
      'landing.hero.title': 'हम आदिवासी भूमि अधिकारों की रक्षा करते हैं — तेज़, निष्पक्ष और पारदर्शी',
      'landing.hero.subtitle': 'AI-संचालित वन अधिकार अधिनियम एटलस और निर्णय समर्थन प्रणाली',
      'landing.cta.submitClaim': 'दावा जमा करें',
      'landing.cta.trackClaim': 'मेरा दावा ट्रैक करें',
      'landing.cta.learnMore': 'FRA क्या है?'
    }
  }
};
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;