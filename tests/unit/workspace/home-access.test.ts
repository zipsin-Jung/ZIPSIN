import { describe, expect, it } from 'vitest';
import { canUseOfficeHome } from '@/features/workspace/domain/home-access';

describe('office-wide home capability', () => {
  it.each([
    ['principal_broker', true],
    ['associate_broker', true],
    ['assistant', true],
    ['landlord', false],
    ['tenant', false],
    ['repairer', false],
    ['ended', false],
    [null, false],
  ])('allows only an office role: %s', (role, allowed) => {
    expect(canUseOfficeHome(role)).toBe(allowed);
  });
});
