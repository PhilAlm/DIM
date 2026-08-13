import { describe, expect, test } from '@jest/globals';
import { isGameStyleLayoutAvailable } from './game-style-layout';

describe('game-style inventory layout eligibility', () => {
  test.each([
    [{ destinyVersion: 2, isPhonePortrait: false, isWide: true }, true],
    [{ destinyVersion: 2, isPhonePortrait: false, isWide: false }, false],
    [{ destinyVersion: 2, isPhonePortrait: true, isWide: true }, false],
    [{ destinyVersion: 1, isPhonePortrait: false, isWide: true }, false],
  ])('returns %s for %o', (input, expected) => {
    expect(isGameStyleLayoutAvailable(input)).toBe(expected);
  });
});
