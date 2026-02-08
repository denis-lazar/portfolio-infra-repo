import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

describe('RealBackend API Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.clear();
  });

  it('login stores user in sessionStorage on success', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'CUSTOMER' };
    
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const user = await api.login('test@test.com', 'password');
    
    expect(user).toEqual(mockUser);
    expect(sessionStorage.getItem('menusync_session_v4')).toContain('test@test.com');
  });

  it('throws error on failed request', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid credentials' }),
    });

    await expect(api.login('test@test.com', 'password')).rejects.toThrow('Invalid credentials');
  });
});
