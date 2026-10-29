import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MerchantsPage } from '../features/catalog/MerchantsPage';
import { MerchantDetailPage } from '../features/catalog/MerchantDetailPage';
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
import { MerchantCard } from '../components/shared/MerchantCard';
import { catalogApi, type CatalogProduct, type PublicStoreDetail } from '../services/api/catalogApi';
import { engagementApi } from '../services/api/engagementApi';
import { ApiError } from '../services/api/apiClient';
import { useRealCartStore } from '../store/realCartStore';
import { useAuthStore } from '../store/authStore';
import { loadCatalogProducts } from '../features/catalog/useStorefront';
import { storefrontMerchant } from '../features/catalog/storefrontModel';

const store: PublicStoreDetail = {
  id: '30000000-0000-4000-8000-000000000001', name: 'Tienda de la API', zone_id: '40000000-0000-4000-8000-000000000001',
  zone_name: 'Zona real', category_code: 'ropa', isOpen: true, accepting_orders: true, logoUrl: null, bannerUrl: null,
  description: 'Descripción persistida', address_text: 'Calle Real 20', phone: '+51912345678', rating_average: null, rating_count: 0,
  preparation_minutes: 18, minimum_order_cents: 1200, base_fee_cents: 350,
  openingIntervals: [{ weekday: 1, opens_at: '08:00:00', closes_at: '20:00:00' }],
};
const product: CatalogProduct = {
  id: '20000000-0000-4000-8000-000000000001', storeId: store.id, storeName: store.name,
  categoryId: '40000000-0000-4000-8000-000000000002', name: 'Camisa de la API', description: 'Algodón', brand: null, isActive: true, position: 0, images: [],
  skus: [{ id: '10000000-0000-4000-8000-000000000001', skuCode: 'PEQ', variantName: 'Pequeña', priceCents: 1000, barcode: null, isActive: true, availableStock: 3 }],
};
const second: CatalogProduct = { ...product, id: '20000000-0000-4000-8000-000000000002', name: 'Camisa agotada',
  skus: [{ ...product.skus[0], id: '10000000-0000-4000-8000-000000000002', availableStock: 0 }] };

beforeEach(() => {
  localStorage.clear();
  useRealCartStore.setState({ items: [], notice: '' });
  useAuthStore.setState({ currentUser: null, profile: null, roles: [], isAuthenticated: false, sessionStatus: 'ready' });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(catalogApi, 'stores').mockResolvedValue([store]);
  vi.spyOn(catalogApi, 'store').mockResolvedValue(store);
  vi.spyOn(catalogApi, 'search').mockResolvedValue({ items: [product], nextCursor: null });
  vi.spyOn(catalogApi, 'product').mockResolvedValue(product);
  vi.spyOn(catalogApi, 'categories').mockResolvedValue([{ id: product.categoryId, code: 'clothing', name: 'Ropa y accesorios' }]);
  vi.spyOn(engagementApi, 'reviews').mockResolvedValue({ items: [], nextCursor: null, average: null, count: 0 });
  vi.spyOn(engagementApi, 'favorites').mockResolvedValue({ items: [], nextCursor: null });
  vi.spyOn(engagementApi, 'favorite').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function page(path: string, element: React.ReactNode, route: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={element}/><Route path="/carrito" element={<h1>Carrito real</h1>}/></Routes></MemoryRouter>);
}

it('conserva buscador, filtros horizontales y pestañas originales y cuenta todas las páginas de la API', async () => {
  vi.mocked(catalogApi.search).mockResolvedValueOnce({ items: [product], nextCursor: product.id }).mockResolvedValueOnce({ items: [second], nextCursor: null });
  page('/negocios?categoria=ropa', <MerchantsPage/>, '/negocios');
  expect(await screen.findByRole('heading', { name: product.name })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Barra de navegación de comercios y productos' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Buscar productos por nombre, marca o tienda/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Productos (2)' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Comercios (1)' })).toBeInTheDocument();
  expect(catalogApi.search).toHaveBeenNthCalledWith(2, { limit: 50, cursor: product.id }, expect.any(AbortSignal));
  expect(screen.queryByText(/35\+ vendidos|4\.8/)).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Agregar al carrito' })[0]);
  expect(useRealCartStore.getState().items[0]).toMatchObject({ productId: product.id, storeId: store.id, skuId: product.skus[0].id });
  expect(screen.getAllByRole('button', { name: 'Agregar al carrito' })[1]).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Comercios (1)' }));
  expect(screen.getByRole('heading', { name: store.name })).toBeInTheDocument();
});

it('muestra error de catálogo y reintenta a vacío sin mostrar entidades mock', async () => {
  vi.mocked(catalogApi.search).mockRejectedValueOnce(new ApiError('Catálogo indisponible', 503, 'UNAVAILABLE')).mockResolvedValue({ items: [], nextCursor: null });
  vi.mocked(catalogApi.stores).mockResolvedValue([]);
  page('/negocios?q=camisa', <MerchantsPage/>, '/negocios');
  expect(await screen.findByRole('alert')).toHaveTextContent('Catálogo indisponible');
  expect(screen.queryByText('Tacacho con cecina')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('No encontramos productos con "camisa"')).toBeInTheDocument();
});

it('mantiene el detalle de tienda original con dirección, horarios y tarifas reales', async () => {
  page(`/negocios/${store.id}`, <MerchantDetailPage/>, '/negocios/:id');
  expect(await screen.findByRole('heading', { name: store.name })).toBeInTheDocument();
  expect(screen.getByText('Calle Real 20')).toBeInTheDocument();
  expect(screen.getByText('18 min de preparación')).toBeInTheDocument();
  expect(screen.getByText('Horario: Lun 08:00–20:00')).toBeInTheDocument();
  expect(screen.getByText('Sin valoraciones')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Agregar al pedido' }));
  expect(useRealCartStore.getState().items[0].skuId).toBe(product.skus[0].id);
});

it('un 404 de producto no muestra otro producto ni una tienda de respaldo', async () => {
  vi.mocked(catalogApi.product).mockRejectedValue(new ApiError('Producto no disponible', 404, 'NOT_FOUND'));
  page(`/producto/${product.id}`, <ProductDetailPage/>, '/producto/:id');
  expect(await screen.findByRole('alert')).toHaveTextContent('Producto no disponible');
  expect(screen.queryByRole('button', { name: 'Comprar ahora' })).not.toBeInTheDocument();
  expect(catalogApi.store).not.toHaveBeenCalled();
});

it('la presentación del detalle original cambia precio, stock y SKU de compra sin descuentos inventados', async () => {
  const large = { ...product.skus[0], id: '10000000-0000-4000-8000-000000000003', variantName: 'Grande', priceCents: 2350, availableStock: 1 };
  vi.mocked(catalogApi.product).mockResolvedValue({ ...product, skus: [...product.skus, large] });
  page(`/producto/${product.id}`, <ProductDetailPage/>, '/producto/:id');
  expect(await screen.findByRole('heading', { name: product.name })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Grande' }));
  expect(screen.getAllByText(/23[.,]50/)).toHaveLength(2);
  expect(screen.getByText('(+1 disponibles)')).toBeInTheDocument();
  expect(screen.queryByText(/% OFF|500 vendidos|175 calificaciones|25 OFF/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }));
  expect(useRealCartStore.getState().items[0]).toMatchObject({ skuId: large.id, quantity: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('La cantidad supera el stock disponible');
  expect(useRealCartStore.getState().items[0].quantity).toBe(1);
});

it('el corazón original confirma persistencia y conserva su estado ante un error de API', async () => {
  const user = { id: '50000000-0000-4000-8000-000000000001', name: 'Persona', email: 'persona@example.test', phone: '+51912345678', role: 'cliente' as const, status: 'activo' as const, createdAt: '2026-10-28T00:00:00Z' };
  useAuthStore.setState({ currentUser: user, isAuthenticated: true });
  vi.mocked(engagementApi.favorite).mockRejectedValueOnce(new ApiError('No se pudo guardar', 503, 'UNAVAILABLE')).mockResolvedValue(undefined);
  page('/negocios', <MerchantCard merchant={storefrontMerchant(store)}/>, '/negocios');
  const heart = screen.getByRole('button', { name: 'Añadir a favoritos' });
  await waitFor(() => expect(heart).not.toBeDisabled());
  fireEvent.click(heart);
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
  expect(heart).toHaveAttribute('aria-pressed', 'false');
  vi.mocked(engagementApi.favorites).mockResolvedValue({ items: [{ kind: 'store', id: store.id, name: store.name, available: true }], nextCursor: null });
  fireEvent.click(heart);
  await waitFor(() => expect(heart).toHaveAttribute('aria-pressed', 'true'));
  expect(engagementApi.favorite).toHaveBeenLastCalledWith('store', store.id, true);
  act(() => useAuthStore.setState({ currentUser: null, isAuthenticated: false }));
  expect(heart).toHaveAttribute('aria-pressed', 'false');
});

it('rechaza cursores repetidos en lugar de truncar o duplicar el catálogo', async () => {
  vi.mocked(catalogApi.search).mockResolvedValue({ items: [product], nextCursor: product.id });
  await expect(loadCatalogProducts()).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
  expect(catalogApi.search).toHaveBeenCalledTimes(2);
});

it('un producto sin SKU no inventa precio ni permite comprar', async () => {
  vi.mocked(catalogApi.product).mockResolvedValue({ ...product, skus: [] });
  page(`/producto/${product.id}`, <ProductDetailPage/>, '/producto/:id');
  expect(await screen.findByRole('heading', { name: product.name })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Comprar ahora' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled();
  expect(screen.getByText('Sin presentaciones')).toBeInTheDocument();
  expect(screen.queryByText(/^S[/]\s*0[.,]00$/)).not.toBeInTheDocument();
});

it('filtra una categoría por UUID tanto en productos como en comercios sin taxonomía local', async () => {
 const otherStore = {...store, id:'30000000-0000-4000-8000-000000000002', name:'Tienda de otra categoría'};
 const otherProduct = {...second, storeId:otherStore.id, storeName:otherStore.name, categoryId:'40000000-0000-4000-8000-000000000003'};
 vi.mocked(catalogApi.stores).mockResolvedValue([store,otherStore]);
 vi.mocked(catalogApi.search).mockResolvedValue({items:[product,otherProduct],nextCursor:null});
 page('/negocios?categoriaProducto='+product.categoryId,<MerchantsPage/>,'/negocios');
 expect(await screen.findByText(product.name,{exact:true})).toBeInTheDocument();
 expect(screen.queryByText(otherProduct.name,{exact:true})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Comercios/}));
 expect(await screen.findByText(store.name,{exact:true})).toBeInTheDocument();
 expect(screen.queryByText(otherStore.name,{exact:true})).not.toBeInTheDocument();
});
