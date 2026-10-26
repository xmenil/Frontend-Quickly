/** Browser normalization; the server independently validates the resulting PNG. */
export async function prepareImage(file: File): Promise<string> {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10*1024*1024) throw new Error('Selecciona PNG, JPEG o WebP de hasta 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1,1600/bitmap.width,1600/bitmap.height); const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(bitmap.width*scale)); canvas.height = Math.max(1,Math.round(bitmap.height*scale));
    const context = canvas.getContext('2d'); if (!context) throw new Error('No se pudo preparar la imagen.');
    context.drawImage(bitmap,0,0,canvas.width,canvas.height); const data = canvas.toDataURL('image/png').split(',')[1];
    if (data.length > 2796204) throw new Error('La imagen preparada supera 2 MB. Usa una imagen de menor tamaño.');
    return data;
  } finally { bitmap.close(); }
}
