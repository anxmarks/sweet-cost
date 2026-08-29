import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.tabList, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Início" />
        </TabTrigger>
        <TabTrigger name="dispensa" href="/dispensa" asChild>
          <TabButton label="Dispensa" />
        </TabTrigger>
        <TabTrigger name="receitas" href="/receitas" asChild>
          <TabButton label="Receitas" />
        </TabTrigger>
        <TabTrigger name="perfil" href="/perfil" asChild>
          <TabButton label="Perfil" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
};

function TabButton({ label, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      style={[styles.tabButton, { borderTopColor: isFocused ? theme.amber : 'transparent' }]}>
      <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderTopWidth: 2,
  },
});
