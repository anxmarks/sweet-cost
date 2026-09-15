import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Image } from 'expo-image';
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
        <TabTrigger name="index" href="/" resetOnFocus asChild>
          <TabButton label="Início" icon={require('@/assets/icons/home-icon.png')} />
        </TabTrigger>
        <TabTrigger name="dispensa" href="/dispensa" resetOnFocus asChild>
          <TabButton label="Dispensa" icon={require('@/assets/icons/whisk-icon.png')} />
        </TabTrigger>
        <TabTrigger name="receitas" href="/receitas" resetOnFocus asChild>
          <TabButton label="Receitas" icon={require('@/assets/icons/chef-icon.png')} />
        </TabTrigger>
        <TabTrigger name="perfil" href="/perfil" resetOnFocus asChild>
          <TabButton label="Perfil" icon={require('@/assets/icons/profile-icon.png')} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon?: number;
};

function TabButton({ label, icon, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      style={[styles.tabButton, { borderTopColor: isFocused ? theme.amber : 'transparent' }]}>
      {icon && (
        <Image
          source={icon}
          style={styles.icon}
          contentFit="contain"
          tintColor={isFocused ? theme.text : theme.textSecondary}
        />
      )}
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
  icon: {
    width: 20,
    height: 20,
    marginBottom: Spacing.half,
  },
});
