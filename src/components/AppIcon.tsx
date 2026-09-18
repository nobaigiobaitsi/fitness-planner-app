import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type AppIconName =
  | 'home'
  | 'exercise'
  | 'calendar'
  | 'progress'
  | 'search'
  | 'favorite'
  | 'favoriteOutline'
  | 'settings'
  | 'add'
  | 'chevronRight'
  | 'clock'
  | 'check'
  | 'play'
  | 'delete'
  | 'close'
  | 'back'
  | 'filter'
  | 'info'
  | 'reset'
  | 'bolt'
  | 'history'
  | 'edit'
  | 'minus'
  | 'plusCircle';

const iconNames = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  exercise: {
    ios: 'figure.strengthtraining.traditional',
    android: 'fitness_center',
    web: 'fitness_center',
  },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  progress: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  favorite: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  favoriteOutline: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  delete: { ios: 'trash.fill', android: 'delete', web: 'delete' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  filter: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  reset: { ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' },
  bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  plusCircle: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
} satisfies Record<AppIconName, SymbolViewProps['name']>;

type AppIconProps = {
  name: AppIconName;
  color: ColorValue;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, color, size = 22, style }: AppIconProps) {
  return (
    <SymbolView
      name={iconNames[name]}
      size={size}
      tintColor={color}
      type="monochrome"
      style={style}
    />
  );
}
