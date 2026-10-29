import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchBar } from '../components/shared/SearchBar';
import { catalogApi, type CatalogProduct } from '../services/api/catalogApi';
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function input() {
  render(<MemoryRouter><SearchBar /></MemoryRouter>);
  const field = screen.getByRole('textbox'); fireEvent.focus(field); return field;
}
it('no precarga historial y diferencia una caída del catálogo de una respuesta vacía', async () => {
  const search = vi.spyOn(catalogApi, 'search').mockRejectedValueOnce(new Error('Catálogo sin conexión')).mockResolvedValue({ items: [], nextCursor: null });
  const field = input();
  expect(localStorage.length).toBe(0);
  expect(screen.queryByText(/Minisol|Pollería|recientes/i)).not.toBeInTheDocument();
  fireEvent.change(field, { target: { value: 'arroz' } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Catálogo sin conexión');
  expect(search).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar búsqueda' }));
  expect(await screen.findByText('No se encontraron productos.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('descarta resultados anteriores aunque el servidor responda después de cambiar la consulta', async () => {
  let finish!: (value: { items: CatalogProduct[]; nextCursor: null }) => void;
  const search = vi.spyOn(catalogApi, 'search').mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ items: [], nextCursor: null });
  const field = input(); fireEvent.change(field, { target: { value: 'anterior' } });
  await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
  const signal = search.mock.calls[0][1];
  fireEvent.change(field, { target: { value: 'actual' } });
  expect(signal?.aborted).toBe(true);
  finish({ items: [{ id: 'resultado-obsoleto', name: 'Producto anterior' } as CatalogProduct], nextCursor: null });
  expect(await screen.findByText('No se encontraron productos.')).toBeInTheDocument();
  expect(screen.queryByText('Producto anterior')).not.toBeInTheDocument();
});
