import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, spacing } from '../theme';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { AddTaskScreen } from '../screens/AddTaskScreen';
import { HealthCheckInScreen } from '../screens/HealthCheckInScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PremiumScreen } from '../screens/PremiumScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  AddTask: undefined;
  HealthCheckIn: undefined;
  TaskDetail: { todo: any }; // Expecting todo object
  Premium: undefined; 
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Stats: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: borderRadius.xl,
          ...shadows.soft,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarShowLabel: false, // Cleaner look
        tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Stats') {
                iconName = focused ? 'leaf' : 'leaf-outline'; 
            } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
            }

            // Active indicator dot
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={iconName} size={24} color={color} />
                    {focused && <View style={styles.activeDot} />}
                </View>
            );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null; 

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        {isSignedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
                name="AddTask" 
                component={AddTaskScreen} 
                options={{ presentation: 'modal' }} 
            />
            <Stack.Screen 
                name="HealthCheckIn" 
                component={HealthCheckInScreen} 
                options={{ presentation: 'modal' }} 
            />
            <Stack.Screen 
                name="TaskDetail" 
                component={TaskDetailScreen} 
                options={{ animation: 'slide_from_right' }} 
            />
             <Stack.Screen 
                name="Premium" 
                component={PremiumScreen} 
                options={{ presentation: 'modal' }} 
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primary,
        marginTop: 4,
    }
});
