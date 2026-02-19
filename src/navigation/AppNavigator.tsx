import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, spacing } from '../theme';
import { standardSlide, modalSlide } from './transitions';

// ... (Rest of imports)

// ... (Types)

// ... (Navigator code)

const styles = StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        paddingTop: 12,
        paddingBottom: 12, // Fixed padding, ignoring safe area for this floating look
        height: 68,
        alignItems: 'center',
        justifyContent: 'space-around',
        ...shadows.soft,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primary,
        marginTop: 4,
    },
    activePill: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primary,
        ...shadows.soft
    }
});

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
const Tab = createMaterialTopTabNavigator<TabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      initialLayout={{ width: Dimensions.get('window').width }}
      screenOptions={{
        swipeEnabled: false,
        tabBarStyle: {
            backgroundColor: 'transparent', // We handle background in container
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
            display: 'none', // correct way to hide indicator in material top tabs
        },
        tabBarContentContainerStyle: {
            backgroundColor: 'transparent'
        },
        tabBarItemStyle: {
             width: 'auto',
             flex: 1
        }
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

import { ScalePressable } from '../components/ui/ScalePressable';

// Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {

    return (
        <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                        ? options.title
                        : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };
                    
                    // Animations
                    const scaleValue = React.useRef(new Animated.Value(1)).current;
                    const opacityValue = React.useRef(new Animated.Value(0)).current; 
                    const translateY = React.useRef(new Animated.Value(10)).current;

                    React.useEffect(() => {
                        if (isFocused) {
                            Animated.parallel([
                                Animated.spring(scaleValue, { toValue: 1.1, useNativeDriver: true, friction: 5 }),
                                Animated.timing(opacityValue, { toValue: 1, duration: 300, useNativeDriver: true }),
                                Animated.spring(translateY, { toValue: 0, useNativeDriver: true })
                            ]).start();
                        } else {
                            Animated.parallel([
                                Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }),
                                Animated.timing(opacityValue, { toValue: 0, duration: 200, useNativeDriver: true }),
                                Animated.spring(translateY, { toValue: 10, useNativeDriver: true })
                            ]).start();
                        }
                    }, [isFocused]);

                    let iconName: any;
                    if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                    else if (route.name === 'Calendar') iconName = isFocused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Stats') iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';

                    // Dynamic Color Logic
                    const activeColor = colors.accentDark; // Use mood color for active state
                    const inactiveColor = colors.textLight;

                    return (
                        <ScalePressable
                            key={index}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{ flex: 1, alignItems: 'center' }}
                        >
                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                {/* Active Pill Background */}
                                <Animated.View 
                                    style={[
                                        styles.activePill, 
                                        { 
                                            opacity: opacityValue,
                                            transform: [{ translateY }],
                                            backgroundColor: activeColor + '15' // Tinted background
                                        }
                                    ]} 
                                />
                                <Ionicons 
                                    name={iconName} 
                                    size={24} 
                                    color={isFocused ? activeColor : inactiveColor} 
                                    style={{ zIndex: 1 }} 
                                />
                            </View>
                        </ScalePressable>
                    );
                })}
            </View>
        </View>
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
          contentStyle: { backgroundColor: colors.background },
          ...standardSlide, // Default transition
        }}
      >
        {isSignedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
                name="AddTask"
                component={AddTaskScreen}
                options={modalSlide}
            />
            <Stack.Screen
                name="HealthCheckIn"
                component={HealthCheckInScreen}
                options={modalSlide}
            />
            <Stack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={standardSlide}
            />
             <Stack.Screen
                name="Premium"
                component={PremiumScreen}
                options={modalSlide}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'fade' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// styles removed from bottom of file
