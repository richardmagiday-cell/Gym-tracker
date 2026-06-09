import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#e63946' }}>
      <Tabs.Screen name="index"   options={{ title: 'Log Workout' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="prs"     options={{ title: 'PRs' }} />
      <Tabs.Screen name="program" options={{ title: 'Program' }} />
    </Tabs>
  );
}
