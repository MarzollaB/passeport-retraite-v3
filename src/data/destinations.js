export const PASSPORT_DESTINATIONS = [
  { id: 'greece', country: 'Grèce', flag: '🇬🇷', label: 'Visa Europe', type: 'visa' },
  { id: 'senegal', country: 'Sénégal', flag: '🇸🇳', label: 'Visa Afrique', type: 'visa' },
  { id: 'argentina', country: 'Argentine', flag: '🇦🇷', label: 'Visa Amérique du Sud', type: 'visa' },

  { id: 'belgium', country: 'Belgique', flag: '🇧🇪', label: 'Mer du Nord · Bredene', type: 'bonus' },
  { id: 'spain', country: 'Espagne', flag: '🇪🇸', label: 'Tenerife · Grande Canarie', type: 'bonus' },
  { id: 'italy', country: 'Italie', flag: '🇮🇹', label: 'Faedis', type: 'bonus' },
  { id: 'turkey', country: 'Turquie', flag: '🇹🇷', label: 'Entre Europe et Asie', type: 'bonus' },
  { id: 'kenya', country: 'Kenya', flag: '🇰🇪', label: 'Safari africain', type: 'bonus' },
  { id: 'egypt', country: 'Égypte', flag: '🇪🇬', label: 'Sur les rives du Nil', type: 'bonus' },
  { id: 'france', country: 'France', flag: '🇫🇷', label: 'Montgenèvre · Bordeaux · Épinal', type: 'bonus' },
  { id: 'dominican-republic', country: 'République dominicaine', flag: '🇩🇴', label: 'Punta Cana', type: 'bonus' },
  { id: 'thailand', country: 'Thaïlande', flag: '🇹🇭', label: 'Escale asiatique', type: 'bonus' },
  { id: 'seychelles', country: 'Seychelles', flag: '🇸🇨', label: 'Océan Indien', type: 'bonus' },
  { id: 'iceland', country: 'Islande', flag: '🇮🇸', label: 'Terre de glace et de feu', type: 'bonus' },
  { id: 'czechia', country: 'Tchéquie', flag: '🇨🇿', label: 'Prague', type: 'bonus' },
  { id: 'south-africa', country: 'Afrique du Sud', flag: '🇿🇦', label: 'Parc Kruger', type: 'bonus' },
  { id: 'tanzania', country: 'Tanzanie', flag: '🇹🇿', label: 'Grande traversée africaine', type: 'bonus' },
  { id: 'uruguay', country: 'Uruguay', flag: '🇺🇾', label: 'Escale sud-américaine', type: 'bonus' },
  { id: 'croatia', country: 'Croatie', flag: '🇭🇷', label: 'Rivages de l’Adriatique', type: 'bonus' },
  { id: 'portugal', country: 'Portugal', flag: '🇵🇹', label: 'Escale ibérique', type: 'bonus' },
]

export const REQUIRED_VISAS = PASSPORT_DESTINATIONS.filter(item => item.type === 'visa')
export const BONUS_DESTINATIONS = PASSPORT_DESTINATIONS.filter(item => item.type === 'bonus')
