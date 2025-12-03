import { Tabs } from 'expo-router';
import { Home, Search, ListTodo, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';

export default function TabLayout() {
  const { totalUnreadCount } = useNotifications();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => (
            <View>
              <ListTodo size={24} color={color} />
              {totalUnreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
