import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardState } from './useWizardState';

describe('useWizardState', () => {
  const options = {
    maxSteps: 3,
    minWidth: 100,
    maxWidth: 2000,
  };

  it('should initialize with step 1', () => {
    const { result } = renderHook(() => useWizardState(options));
    // As the state is initialized as {} as T, step will be undefined initially 
    // but the getter currentStep handles the default 1.
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(true);
  });

  it('should go to next step', () => {
    const { result } = renderHook(() => useWizardState(options));
    
    act(() => {
      result.current.goNext();
    });
    
    expect(result.current.currentStep).toBe(2);
  });

  it('should not go beyond maxSteps', () => {
    const { result } = renderHook(() => useWizardState(options));
    
    act(() => { result.current.goNext(); }); // 2
    act(() => { result.current.goNext(); }); // 3
    act(() => { result.current.goNext(); }); // Should stay at 3
    
    expect(result.current.currentStep).toBe(3);
    expect(result.current.isLastStep).toBe(true);
  });

  it('should validate dimensions correctly', () => {
    const { result } = renderHook(() => useWizardState(options));
    
    expect(result.current.validateDimensions(500, 500)).toBe(true);
    expect(result.current.validateDimensions(50, 500)).toBe(false); // Too narrow
    expect(result.current.validateDimensions(2500, 500)).toBe(false); // Too wide
  });

  it('should use onValidateStep if provided', () => {
    const onValidateStep = vi.fn((step, state) => step < 2);
    const { result } = renderHook(() => useWizardState({ ...options, onValidateStep }));
    
    expect(result.current.canGoNext).toBe(true); // Step 1 is allowed
    
    act(() => {
      result.current.goNext();
    });
    
    expect(result.current.currentStep).toBe(2);
    expect(result.current.canGoNext).toBe(false); // Step 2 is forbidden by mock
  });
});
