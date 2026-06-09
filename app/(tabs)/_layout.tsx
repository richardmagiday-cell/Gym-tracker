import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e63946',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F5',
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: 'FitTrackr',
          title: 'Today',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={'barbell-outline' as IconName} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          headerTitle: 'History',
          title: 'History',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={'time-outline' as IconName} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          headerTitle: 'Progress',
          title: 'Progress',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={'trending-up-outline' as IconName} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="prs"
        options={{
          headerTitle: 'Personal Records',
          title: 'PRs',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={'trophy-outline' as IconName} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          headerTitle: 'Programs',
          title: 'Program',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={'calendar-outline' as IconName} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
