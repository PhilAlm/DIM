import { t } from 'app/i18next-t';
import clsx from 'clsx';
import * as styles from './InventoryLayoutToggle.m.scss';

export type InventoryLayout = 'classic' | 'game';

export default function InventoryLayoutToggle({
  layout,
  onChange,
}: {
  layout: InventoryLayout;
  onChange: (layout: InventoryLayout) => void;
}) {
  return (
    <div className={styles.toggle} role="group" aria-label={t('Settings.InventoryLayout')}>
      <button
        type="button"
        className={clsx(styles.toggleButton, { [styles.selected]: layout === 'classic' })}
        aria-pressed={layout === 'classic'}
        onClick={() => onChange('classic')}
      >
        {t('Settings.InventoryLayoutClassic')}
      </button>
      <button
        type="button"
        className={clsx(styles.toggleButton, { [styles.selected]: layout === 'game' })}
        aria-pressed={layout === 'game'}
        onClick={() => onChange('game')}
      >
        {t('Settings.InventoryLayoutGame')}
      </button>
    </div>
  );
}
