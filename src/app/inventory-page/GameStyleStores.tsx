import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { itemPop } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { locateItem$ } from 'app/inventory/locate-item';
import { dropItem } from 'app/inventory/move-item';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket, getCurrentStore, getVault } from 'app/inventory/stores-helpers';
import IssueAwarenessBanner from 'app/issue-awareness-banner/IssueAwarenessBanner';
import ItemFeedSidebar from 'app/item-feed/ItemFeedSidebar';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, maximizeIcon, minimizeIcon, powerActionIcon } from 'app/shell/icons';
import StoreStats from 'app/store-stats/StoreStats';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import CharacterTile from '../character-tile/CharacterTile';
import {
  categoryForLocatedItem,
  gameInventoryCategories,
  GameInventoryCategory,
  gameStyleCharacters,
} from './game-style-layout';
import * as styles from './GameStyleStores.m.scss';
import InventoryLayoutToggle, { InventoryLayout } from './InventoryLayoutToggle';
import StoreBucket from './StoreBucket';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import { StoreBuckets } from './StoreBuckets';
import StoreInventoryItem from './StoreInventoryItem';
import './Stores.scss';

const weaponBuckets = [
  BucketHashes.KineticWeapons,
  BucketHashes.EnergyWeapons,
  BucketHashes.PowerWeapons,
];

const armorBuckets = [
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
];

const auxiliaryBuckets = [BucketHashes.Subclass, BucketHashes.Ghost, BucketHashes.Artifacts];

export default function GameStyleStores({
  stores,
  buckets,
  singleCharacter,
  inventoryLayout,
  onInventoryLayoutChange,
}: {
  stores: DimStore[];
  buckets: InventoryBuckets;
  singleCharacter: boolean;
  inventoryLayout: InventoryLayout;
  onInventoryLayoutChange: (layout: InventoryLayout) => void;
}) {
  const currentStore = getCurrentStore(stores);
  const vault = getVault(stores);
  const setSetting = useSetSetting();
  const [selectedStoreId, setSelectedStoreId] = useState(currentStore?.id);
  const [selectedCategory, setSelectedCategory] = useState<GameInventoryCategory>('Weapons');

  const characters = useMemo(
    () => (currentStore ? gameStyleCharacters(stores, currentStore, singleCharacter) : []),
    [currentStore, singleCharacter, stores],
  );

  useEffect(() => {
    if (currentStore && !characters.some((store) => store.id === selectedStoreId)) {
      setSelectedStoreId(currentStore.id);
    }
  }, [characters, currentStore, selectedStoreId]);

  const selectedStore = characters.find((store) => store.id === selectedStoreId) ?? currentStore;

  useEventBusListener(
    locateItem$,
    useCallback(
      (item) => {
        if (item.owner !== 'vault' && characters.some((store) => store.id === item.owner)) {
          setSelectedStoreId(item.owner);
        }
        const category = categoryForLocatedItem(item);
        if (item.owner === 'vault' || !['Weapons', 'Armor'].includes(category)) {
          setSelectedCategory(category);
        }
        setTimeout(() => itemPop(item), 150);
      },
      [characters],
    ),
  );

  if (!currentStore || !vault || !selectedStore) {
    return null;
  }

  return (
    <div className={styles.inventoryContainer}>
      <main className={styles.content} aria-label={t('Header.Inventory')}>
        <header className={styles.toolbar}>
          <CharacterSwitcher
            stores={characters}
            buckets={buckets}
            selectedStore={selectedStore}
            onSelect={setSelectedStoreId}
          />
          <button
            type="button"
            className={styles.singleCharacterButton}
            onClick={() => setSetting('singleCharacter', !singleCharacter)}
            title={
              singleCharacter ? t('Settings.ExpandSingleCharacter') : t('Settings.SingleCharacter')
            }
          >
            <AppIcon icon={singleCharacter ? minimizeIcon : maximizeIcon} />
            <span>{t('Settings.SingleCharacter')}</span>
          </button>
          <InventoryLayoutToggle layout={inventoryLayout} onChange={onInventoryLayoutChange} />
        </header>

        {$featureFlags.issueBanner && <IssueAwarenessBanner />}

        <section className={styles.stage} id="game-style-character-panel">
          <EquipmentRail
            label={t('Bucket.Weapons')}
            bucketHashes={weaponBuckets}
            buckets={buckets}
            store={selectedStore}
            align="right"
          />
          <CharacterIdentity store={selectedStore} buckets={buckets} />
          <EquipmentRail
            label={t('Bucket.Armor')}
            bucketHashes={armorBuckets}
            buckets={buckets}
            store={selectedStore}
          />
        </section>

        <InventoryDeck
          selectedCategory={selectedCategory}
          onCategorySelected={setSelectedCategory}
          selectedStore={selectedStore}
          currentStore={currentStore}
          vault={vault}
          buckets={buckets}
          singleCharacter={singleCharacter}
        />
      </main>
      {$featureFlags.itemFeed && <ItemFeedSidebar />}
    </div>
  );
}

function CharacterSwitcher({
  stores,
  buckets,
  selectedStore,
  onSelect,
}: {
  stores: DimStore[];
  buckets: InventoryBuckets;
  selectedStore: DimStore;
  onSelect: (storeId: string) => void;
}) {
  const selectByOffset = (offset: number) => {
    const currentIndex = stores.findIndex((store) => store.id === selectedStore.id);
    const nextIndex = (currentIndex + offset + stores.length) % stores.length;
    onSelect(stores[nextIndex].id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectByOffset(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectByOffset(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onSelect(stores[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      onSelect(stores.at(-1)!.id);
    }
  };

  return (
    <div
      className={styles.characterSwitcher}
      role="tablist"
      aria-label={t('Settings.CharacterOrder')}
      onKeyDown={onKeyDown}
    >
      {stores.map((store) => (
        <CharacterTab
          key={store.id}
          store={store}
          buckets={buckets}
          selected={store.id === selectedStore.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function CharacterTab({
  store,
  buckets,
  selected,
  onSelect,
}: {
  store: DimStore;
  buckets: InventoryBuckets;
  selected: boolean;
  onSelect: (storeId: string) => void;
}) {
  const dispatch = useThunkDispatch();
  const acceptedTypes = useMemo(() => [...Object.keys(buckets.byHash), 'postmaster'], [buckets]);
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: acceptedTypes,
      canDrop: (item) => item.owner !== store.id && !item.notransfer,
      drop: (item) => dispatch(dropItem(item, store.id, false)),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }),
    [acceptedTypes, dispatch, store.id],
  );

  return (
    <button
      ref={(element) => {
        dropRef(element);
      }}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls="game-style-character-panel"
      tabIndex={selected ? 0 : -1}
      className={clsx(styles.characterTab, {
        [styles.selectedCharacter]: selected,
        [styles.canDrop]: canDrop,
        [styles.isOver]: canDrop && isOver,
      })}
      onClick={() => onSelect(store.id)}
    >
      <CharacterTile store={store} />
    </button>
  );
}

function EquipmentRail({
  label,
  bucketHashes,
  buckets,
  store,
  align = 'left',
}: {
  label: string;
  bucketHashes: number[];
  buckets: InventoryBuckets;
  store: DimStore;
  align?: 'left' | 'right';
}) {
  return (
    <section
      className={clsx(styles.equipmentRail, { [styles.rightAlignedRail]: align === 'right' })}
      aria-label={label}
    >
      <h2>{label}</h2>
      {bucketHashes.map((bucketHash) => {
        const bucket = buckets.byHash[bucketHash];
        return bucket ? (
          <section className={styles.equipmentBucket} key={bucketHash}>
            <h3>{bucket.name}</h3>
            <StoreBucket
              store={store}
              bucket={bucket}
              singleCharacter={false}
              addItemToUnequippedGrid
            />
          </section>
        ) : null;
      })}
    </section>
  );
}

function CharacterIdentity({ store, buckets }: { store: DimStore; buckets: InventoryBuckets }) {
  return (
    <section
      className={styles.identity}
      style={{
        backgroundColor: store.color
          ? `rgb(${Math.round(store.color.red)}, ${Math.round(store.color.green)}, ${Math.round(
              store.color.blue,
            )})`
          : undefined,
        backgroundImage: `linear-gradient(to bottom, rgb(10, 12, 19, 0.18), rgb(10, 12, 19, 0.96)), url("${store.background}")`,
      }}
    >
      <ClassIcon classType={store.classType} proportional className={styles.classIcon} />
      <div className={styles.identityText}>
        <div className={styles.className}>{store.className}</div>
        <div className={styles.title}>{store.titleInfo?.title ?? store.genderRace}</div>
        <div className={styles.power}>
          <AppIcon icon={powerActionIcon} />
          {store.powerLevel}
        </div>
      </div>
      <StoreStats store={store} />
      <div className={styles.auxiliarySlots}>
        {auxiliaryBuckets.map((bucketHash) => {
          const bucket = buckets.byHash[bucketHash];
          return bucket ? <AuxiliarySlot key={bucketHash} store={store} bucket={bucket} /> : null;
        })}
      </div>
    </section>
  );
}

function AuxiliarySlot({ store, bucket }: { store: DimStore; bucket: InventoryBucket }) {
  const items = findItemsByBucket(store, bucket.hash);
  const item = items.find((item) => item.equipped) ?? items[0];

  return (
    <div className={styles.auxiliarySlot}>
      <span>{bucket.name}</span>
      <StoreBucketDropTarget
        grouped={false}
        equip={bucket.equippable}
        bucket={bucket}
        storeId={store.id}
        storeClassType={store.classType}
      >
        {item && (
          <div className="equipped-item">
            <StoreInventoryItem item={item} />
          </div>
        )}
      </StoreBucketDropTarget>
    </div>
  );
}

function InventoryDeck({
  selectedCategory,
  onCategorySelected,
  selectedStore,
  currentStore,
  vault,
  buckets,
  singleCharacter,
}: {
  selectedCategory: GameInventoryCategory;
  onCategorySelected: (category: GameInventoryCategory) => void;
  selectedStore: DimStore;
  currentStore: DimStore;
  vault: DimStore;
  buckets: InventoryBuckets;
  singleCharacter: boolean;
}) {
  const onKeyDown = (event: React.KeyboardEvent) => {
    const selectedIndex = gameInventoryCategories.indexOf(selectedCategory);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onCategorySelected(
        gameInventoryCategories[(selectedIndex + 1) % gameInventoryCategories.length],
      );
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onCategorySelected(
        gameInventoryCategories[
          (selectedIndex - 1 + gameInventoryCategories.length) % gameInventoryCategories.length
        ],
      );
    }
  };

  const categoryBuckets =
    selectedCategory === 'Postmaster'
      ? buckets.byCategory.Postmaster
      : D2Categories[selectedCategory];
  const storesForCategory =
    selectedCategory === 'Weapons' || selectedCategory === 'Armor'
      ? [vault]
      : selectedCategory === 'Postmaster'
        ? [selectedStore]
        : [selectedStore, vault];
  const singleStore = storesForCategory.length === 1;

  return (
    <section className={styles.inventoryDeck} aria-label={t('Header.Inventory')}>
      <div
        className={styles.categoryTabs}
        role="tablist"
        aria-label={t('Header.Inventory')}
        onKeyDown={onKeyDown}
      >
        {gameInventoryCategories.map((category) => (
          <button
            type="button"
            role="tab"
            id={`game-inventory-tab-${category}`}
            aria-controls="game-inventory-panel"
            aria-selected={selectedCategory === category}
            tabIndex={selectedCategory === category ? 0 : -1}
            className={clsx(styles.categoryTab, {
              [styles.selectedCategory]: selectedCategory === category,
            })}
            onClick={() => onCategorySelected(category)}
            key={category}
          >
            {t(`Bucket.${category}`)}
          </button>
        ))}
      </div>
      <div
        id="game-inventory-panel"
        role="tabpanel"
        aria-labelledby={`game-inventory-tab-${selectedCategory}`}
        className={clsx(styles.deckRows, { [styles.singleStore]: singleStore })}
      >
        <div className={clsx('store-row', styles.deckStoreHeaders)} aria-hidden="true">
          {storesForCategory.map((store) => (
            <div className="store-cell" key={store.id}>
              <span>{store.isVault ? t('Bucket.Vault') : store.className}</span>
            </div>
          ))}
        </div>
        {categoryBuckets.map((bucketHashOrBucket) => {
          const bucket =
            typeof bucketHashOrBucket === 'number'
              ? buckets.byHash[bucketHashOrBucket]
              : bucketHashOrBucket;
          return bucket ? (
            <StoreBuckets
              key={bucket.hash}
              bucket={bucket}
              stores={storesForCategory}
              vault={vault}
              currentStore={currentStore}
              labels
              singleCharacter={singleCharacter}
            />
          ) : null;
        })}
      </div>
    </section>
  );
}
