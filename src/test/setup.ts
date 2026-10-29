import '@testing-library/jest-dom';
import { vi } from 'vitest';
// Existing prototype tests are fixtures in explicit demo mode. F1 tests override appMode.
vi.stubEnv('VITE_APP_MODE', 'demo');
