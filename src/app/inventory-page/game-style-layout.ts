import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';

export type GameInventoryCategory = 'Weapons' | 'Armor' | 'General' | 'Inventory' | 'Postmaster';

export const gameInventoryCategories: GameInventoryCategory[] = [
  'Weapons',
  'Armor',
  'General',
  'Inventory',
  'Postmaster',
];

export function isGameStyleLayoutAvailable({
  destinyVersion,
  isPhonePortrait,
  isWide,
}: {
  destinyVersion: number;
  isPhonePortrait: boolean;
  isWide: boolean;
}) {
  return destinyVersion === 2 && !isPhonePortrait && isWide;
}

export function categoryForLocatedItem(item: DimItem): GameInventoryCategory {
  if (item.location.inPostmaster || item.bucket.sort === 'Postmaster') {
    return 'Postmaster';
  }
  return gameInventoryCategories.includes(item.bucket.sort as GameInventoryCategory)
    ? (item.bucket.sort as GameInventoryCategory)
    : 'General';
}

export function gameStyleCharacters(
  stores: DimStore[],
  currentStore: DimStore,
  singleCharacter: boolean,
) {
  return singleCharacter ? [currentStore] : stores.filter((store) => !store.isVault);
}
