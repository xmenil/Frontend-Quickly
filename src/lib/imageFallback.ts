/**
 * Generates crisp, category-aware SVG data URIs as elegant fallbacks
 * when external product or merchant images fail to load or are missing.
 * Prevents broken images or empty gray boxes.
 */

export function getCategoryFallbackSvg(category?: string, name?: string): string {
  const cat = (category || '').toLowerCase();
  const title = name ? name.slice(0, 24) : 'Quickly Tingo María';

  // Determine theme colors and icon path based on category
  let bgColor = '%23FDF2F8'; // default pink-50
  let strokeColor = '%23BE185D'; // primary berry
  let iconPath = ''; // SVG path

  if (cat.includes('farmacia') || cat.includes('salud') || cat.includes('medicin')) {
    // Pharmacy / Health (Emerald / Cyan)
    bgColor = '%23ECFDF5';
    strokeColor = '%23059669';
    // Cross / Pill
    iconPath = '<path d="M12 4v16m-8-8h16" stroke-width="2.5" stroke-linecap="round"/>';
  } else if (cat.includes('cafe') || cat.includes('café') || cat.includes('cacao') || cat.includes('chocolate')) {
    // Coffee / Cacao (Amber / Brown)
    bgColor = '%23FFFBEB';
    strokeColor = '%23D97706';
    // Coffee cup
    iconPath = '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v3m4-3v3m4-3v3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (cat.includes('tienda') || cat.includes('bodega') || cat.includes('mercado') || cat.includes('super')) {
    // Shopping / Grocery
    bgColor = '%23F0FDF4';
    strokeColor = '%2316A34A';
    // Shopping bag
    iconPath = '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (cat.includes('postre') || cat.includes('pan') || cat.includes('dulce')) {
    // Bakery / Desserts
    bgColor = '%23FFF7ED';
    strokeColor = '%23EA580C';
    // Cake / treat
    iconPath = '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M12 11V7m0-4v1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else {
    // Default Food / Restaurant (Tacacho, Juane, Amazonian dishes)
    bgColor = '%23FFF1F2';
    strokeColor = '%23BE185D';
    // Utensils / Fork and spoon
    iconPath = '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2m3 9v11M6 2v10a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2m-2 12v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bgColor}"/>
    <circle cx="200" cy="120" r="50" fill="%23FFFFFF" fill-opacity="0.9" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.06))"/>
    <g transform="translate(186, 106) scale(1.15)" stroke="${strokeColor}" fill="none">
      ${iconPath}
    </g>
    <text x="200" y="200" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="16" fill="%23172033">
      ${encodeURIComponent(title)}
    </text>
    <text x="200" y="224" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="${strokeColor}">
      Quickly • Tingo María
    </text>
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${svg}`;
}

export function getMerchantFallbackBanner(category?: string, name?: string): string {
  const cat = (category || '').toLowerCase();
  const title = name ? name.slice(0, 28) : 'Comercio Local';

  let bgColor = '%23FFF1F6';
  let strokeColor = '%23BE185D';

  if (cat.includes('farmacia')) {
    bgColor = '%23ECFDF5';
    strokeColor = '%23059669';
  } else if (cat.includes('cafe') || cat.includes('cacao')) {
    bgColor = '%23FFFBEB';
    strokeColor = '%23D97706';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338">
    <rect width="600" height="338" fill="${bgColor}"/>
    <circle cx="300" cy="140" r="54" fill="%23FFFFFF" fill-opacity="0.95"/>
    <g transform="translate(284, 124) scale(1.3)" stroke="${strokeColor}" fill="none">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M2 7v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7M2 7h20M10 12h4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="300" y="225" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="%23172033">
      ${encodeURIComponent(title)}
    </text>
    <text x="300" y="250" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="${strokeColor}">
      Comercio Aliado • Tingo María
    </text>
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${svg}`;
}
