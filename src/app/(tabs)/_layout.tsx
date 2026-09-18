import { Tabs } from 'expo-router';
import { ColorValue, Platform } from 'react-native';

import { AppIcon, AppIconName } from '@/components/AppIcon';
import { colors } from '@/theme/tokens';

function TabIcon({ name, color, size }: { name: AppIconName; color: ColorValue; size: number }) {
  return <AppIcon name={name} color={color} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, size }) => <TabIcon name="exercise" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <TabIcon name="progress" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
