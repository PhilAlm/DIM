import { settingSelector } from 'app/dim-api/selectors';
import { bucketsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useLocalStorage } from 'app/utils/hooks';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PhoneStores from '../inventory-page/PhoneStores';
import DesktopStores from './DesktopStores';
import { isGameStyleLayoutAvailable } from './game-style-layout';
import GameStyleStores from './GameStyleStores';
import { InventoryLayout } from './InventoryLayoutToggle';

const gameLayoutMediaQuery = '(min-width: 900px)';

function useWideInventoryLayout() {
  const [isWide, setIsWide] = useState(
    () => 'matchMedia' in window && window.matchMedia(gameLayoutMediaQuery).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(gameLayoutMediaQuery);
    const onChange = (event: MediaQueryListEvent) => setIsWide(event.matches);
    setIsWide(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isWide;
}

/**
 * Display inventory and character headers for all characters and the vault.
 */
export default function Stores() {
  const stores = useSelector(sortedStoresSelector);
  const buckets = useSelector(bucketsSelector);
  const singleCharacter = useSelector(settingSelector('singleCharacter'));
  const isPhonePortrait = useIsPhonePortrait();
  const isWide = useWideInventoryLayout();
  const [inventoryLayout, setInventoryLayout] = useLocalStorage<InventoryLayout>(
    'inventoryLayout',
    'classic',
  );
  if (!stores.length || !buckets) {
    return null;
  }

  const gameLayoutAvailable = isGameStyleLayoutAvailable({
    destinyVersion: stores[0].destinyVersion,
    isPhonePortrait,
    isWide,
  });

  if (isPhonePortrait) {
    return <PhoneStores stores={stores} buckets={buckets} singleCharacter={singleCharacter} />;
  }

  return gameLayoutAvailable && inventoryLayout === 'game' ? (
    <GameStyleStores
      stores={stores}
      buckets={buckets}
      singleCharacter={singleCharacter}
      inventoryLayout={inventoryLayout}
      onInventoryLayoutChange={setInventoryLayout}
    />
  ) : (
    <DesktopStores
      stores={stores}
      buckets={buckets}
      singleCharacter={singleCharacter}
      inventoryLayout={gameLayoutAvailable ? inventoryLayout : undefined}
      onInventoryLayoutChange={gameLayoutAvailable ? setInventoryLayout : undefined}
    />
  );
}
