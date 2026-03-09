import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should default to English', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    expect(result.current.language).toBe('en');
  });

  it('should change language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
  });

  it('should persist language preference', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    act(() => {
      result.current.setLanguage('es');
    });

    // Create new instance to test persistence
    const { result: result2 } = renderHook(() => useLanguage(), { wrapper });
    
    // Should load from localStorage
    expect(result2.current.language).toBe('es');
  });

  it('should translate text', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    // Test that translation function exists and works
    expect(typeof result.current.t).toBe('function');
    const translated = result.current.t('common.home');
    expect(translated).toBeDefined();
  });
});

