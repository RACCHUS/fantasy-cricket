import { describe, it, expect } from 'vitest';
import { cn, formatPrice, formatNumber, getInitials } from '@/lib/utils';

describe('cn (class merge utility)', () => {
  it('merges classes correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatPrice', () => {
  it('formats integer to decimal', () => {
    expect(formatPrice(105)).toBe('10.5');
    expect(formatPrice(100)).toBe('10.0');
    expect(formatPrice(95)).toBe('9.5');
  });
});

describe('formatNumber', () => {
  it('formats thousands with K', () => {
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(10000)).toBe('10.0K');
  });

  it('formats millions with M', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
  });

  it('returns plain number for small values', () => {
    expect(formatNumber(500)).toBe('500');
  });
});

describe('getInitials', () => {
  it('extracts initials from full name', () => {
    expect(getInitials('Virat Kohli')).toBe('VK');
    expect(getInitials('MS Dhoni')).toBe('MD');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('Sachin Ramesh Tendulkar')).toBe('SR');
  });

  it('handles single names', () => {
    expect(getInitials('Rohit')).toBe('R');
  });
});
