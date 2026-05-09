import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          backgroundColor: '#3C3C45',
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Αρχική',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
      name="history"
      options={{
        title: 'Ιστορικό',
        tabBarIcon: ({ color }) => <IconSymbol size={26} name="doc.text.fill" color={color} />,
      }}
    />
    <Tabs.Screen
      name="tests"
      options={{
        title: 'Τεστ',
        tabBarIcon: ({ color }) => <IconSymbol size={26} name="book.fill" color={color} />,
      }}
    />
    <Tabs.Screen
      name="testhistory"
      options={{
        title: 'Αποτελέσματα',
        tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
      }}
    />
    </Tabs>
  );
}