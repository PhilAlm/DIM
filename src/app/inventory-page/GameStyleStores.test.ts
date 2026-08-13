import { describe, expect, test } from '@jest/globals';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { categoryForLocatedItem, gameStyleCharacters } from './game-style-layout';

describe('game-style inventory helpers', () => {
  const currentStore = {
    id: 'current',
    current: true,
    isVault: false,
    classType: DestinyClass.Titan,
  } as DimStore;
  const otherStore = {
    id: 'other',
    current: false,
    isVault: false,
    classType: DestinyClass.Hunter,
  } as DimStore;
  const vault = { id: 'vault', current: false, isVault: true } as DimStore;

  test('shows all Guardians outside single-character mode', () => {
    expect(gameStyleCharacters([currentStore, otherStore, vault], currentStore, false)).toEqual([
      currentStore,
      otherStore,
    ]);
  });

  test('shows only the current Guardian in single-character mode', () => {
    expect(gameStyleCharacters([currentStore, otherStore, vault], currentStore, true)).toEqual([
      currentStore,
    ]);
  });

  test.each([
    [{ location: { inPostmaster: true }, bucket: { sort: 'Weapons' } }, 'Postmaster'],
    [{ location: { inPostmaster: false }, bucket: { sort: 'Weapons' } }, 'Weapons'],
    [{ location: { inPostmaster: false }, bucket: { sort: 'Armor' } }, 'Armor'],
    [{ location: { inPostmaster: false }, bucket: { sort: 'Inventory' } }, 'Inventory'],
    [{ location: { inPostmaster: false }, bucket: { sort: 'Unknown' } }, 'General'],
  ])('routes a located item to %s', (item, expected) => {
    expect(categoryForLocatedItem(item as DimItem)).toBe(expected);
  });
});
