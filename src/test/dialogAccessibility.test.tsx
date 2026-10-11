import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '../components/ui/Dialog';

afterEach(() => cleanup());

describe('Dialog keyboard navigation', () => {
  it('contains keyboard focus and restores the trigger when closed', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Abrir';
    document.body.appendChild(trigger);
    trigger.focus();
    const { rerender } = render(
      <Dialog isOpen onClose={() => {}} title="Asignar repartidor">
        <button>Confirmar</button>
      </Dialog>
    );
    const close = screen.getByRole('button', { name: 'Cerrar modal' });
    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(confirm, { key: 'Tab' });
    expect(close).toHaveFocus();
    trigger.focus();
    expect(close).toHaveFocus();
    rerender(<Dialog isOpen={false} onClose={() => {}}>Contenido</Dialog>);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('keeps focus when a parent updates and calls the latest close handler with Escape', () => {
    const firstClose = vi.fn();
    const latestClose = vi.fn();
    const { rerender } = render(
      <Dialog isOpen onClose={firstClose} title="Asignar repartidor">
        <input aria-label="Repartidor" />
      </Dialog>
    );
    const input = screen.getByRole('textbox', { name: 'Repartidor' });
    input.focus();
    rerender(
      <Dialog isOpen onClose={latestClose} title="Asignar repartidor">
        <input aria-label="Repartidor" />
      </Dialog>
    );
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(latestClose).toHaveBeenCalledOnce();
    expect(firstClose).not.toHaveBeenCalled();
  });
});
