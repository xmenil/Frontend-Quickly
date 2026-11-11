export const STORE_COVER_IMAGES: Record<string, string> = {
  'botica san martín': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=700&auto=format&fit=crop&q=80',
  'botica san martin': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=700&auto=format&fit=crop&q=80',
  'farmacia vida': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=700&auto=format&fit=crop&q=80',
  'cacao & café tingo': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&auto=format&fit=crop&q=80',
  'cacao & cafe tingo': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&auto=format&fit=crop&q=80',
  'carsa tingo maría': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80',
  'carsa tingo maria': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80',
  'tiendas efe tingo maría': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80',
  'tiendas efe': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80',
  'el encanto amazónico': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80',
  'el encanto amazonico': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80',
  'la selva gourmet': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
  'restaurante & pollería rubén': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=700&auto=format&fit=crop&q=80',
  'restaurante & polleria ruben': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=700&auto=format&fit=crop&q=80',
  'pollería el dorado': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=700&auto=format&fit=crop&q=80',
  'polleria el dorado': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=700&auto=format&fit=crop&q=80',
  'pasonki tm': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80',
  'de tinto & madero': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
  'recreo campestre villa': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80',
  'feria escolar': 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=700&auto=format&fit=crop&q=80',
  'galeria san benito': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80',
  'galería san benito': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80',
  'importaciones el balcón': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80',
  'importaciones el balcon': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80',
  'moda selva tingo': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80',
  'muebles tingo': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
};

export function getStoreCoverImage(st: { name?: string; bannerUrl?: string | null; category?: string; category_code?: string }): string {
  if (st.bannerUrl && typeof st.bannerUrl === 'string' && st.bannerUrl.startsWith('http') && !st.bannerUrl.includes('data:image')) {
    return st.bannerUrl;
  }
  const n = (st.name || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(STORE_COVER_IMAGES)) {
    if (n.includes(key) || key.includes(n)) return url;
  }
  const cat = ((st.category || st.category_code) || '').toLowerCase();
  if (cat.includes('farmacia') || cat.includes('salud') || cat.includes('botica') || cat.includes('medicin')) {
    return 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('cafe') || cat.includes('café') || cat.includes('cacao') || cat.includes('emprendedor') || cat.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('electro') || cat.includes('tecno') || cat.includes('hogar') || cat.includes('cómputo')) {
    return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('restaurante') || cat.includes('comida') || cat.includes('gastronom') || cat.includes('poller')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('moda') || cat.includes('ropa') || cat.includes('calzado') || cat.includes('zapat')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('mueble') || cat.includes('colchón') || cat.includes('cama')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('escolar') || cat.includes('librería') || cat.includes('libreria') || cat.includes('juguete')) {
    return 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=700&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=700&auto=format&fit=crop&q=80';
}

