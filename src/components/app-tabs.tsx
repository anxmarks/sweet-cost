import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.tabList}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Home" icon={require('@/assets/images/tabIcons/home.png')} />
        </TabTrigger>
        <TabTrigger name="dispensa" href="/dispensa" asChild>
          <TabButton label="Dispensa" icon={require('@/assets/images/tabIcons/home.png')} />
        </TabTrigger>
        <TabTrigger name="receitas" href="/receitas" asChild>
          <TabButton label="Receitas" icon={require('@/assets/images/tabIcons/explore.png')} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: number;
};

function TabButton({ label, icon, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={styles.tabButton}>
      <Image source={icon} style={[styles.icon, { opacity: isFocused ? 1 : 0.5 }]} />
      <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: 24,
    height: 24,
  },
});
