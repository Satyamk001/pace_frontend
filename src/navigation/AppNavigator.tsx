import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadows, borderRadius, spacing } from '../theme';
import { standardSlide, modalSlide } from './transitions';
import { useSubscription } from '../context/SubscriptionContext';

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

// Phase 2 Screens
import { FoodScreen } from '../screens/FoodScreen';
import { MedicineScreen } from '../screens/MedicineScreen';
import { WeightScreen } from '../screens/WeightScreen';
import { HealthHubScreen } from '../screens/HealthHubScreen';
import { OfflineProvider } from '../context/OfflineContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { ScalePressable } from '../components/ui/ScalePressable';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  AddTask: undefined;
  HealthCheckIn: undefined;
  TaskDetail: { todo: any };
  Premium: undefined;
  Food: undefined;
  Medicine: undefined;
  Weight: undefined;
  Reports: undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Health: undefined; // Changed from Stats
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<TabParamList>();

const PILL_SIZE = 40;

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
        height: 68,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
        elevation: 6,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillBase: {
        position: 'absolute',
        width: PILL_SIZE,
        height: PILL_SIZE,
        borderRadius: PILL_SIZE / 2.5,
        backgroundColor: colors.surfaceSoft,
    },
    activeDot: {
        position: 'absolute',
        bottom: -10,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.accentDark || colors.primary,
    }
});

const TabItem = ({ isFocused, onPress, onLongPress, route }: any) => {
    const { isProUser } = useSubscription();

    let iconNameFocused: any;
    let iconNameOutline: any;
    if (route.name === 'Home') { iconNameFocused = 'home'; iconNameOutline = 'home-outline'; }
    else if (route.name === 'Calendar') { iconNameFocused = 'calendar'; iconNameOutline = 'calendar-outline'; }
    else if (route.name === 'Health') { iconNameFocused = 'heart'; iconNameOutline = 'heart-outline'; }
    else if (route.name === 'Profile') { iconNameFocused = 'person'; iconNameOutline = 'person-outline'; }

    const iconName = isFocused ? iconNameFocused : iconNameOutline;

    const pillScale = React.useRef(new Animated.Value(isFocused ? 1 : 0.5)).current;
    const pillOpacity = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    const iconTranslateY = React.useRef(new Animated.Value(isFocused ? -3 : 0)).current;
    const iconScale = React.useRef(new Animated.Value(isFocused ? 1.18 : 1)).current;

    const pressScale = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (isFocused) {
            Animated.parallel([
                Animated.spring(pillScale, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: true }),
                Animated.spring(pillOpacity, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: true }),
                Animated.spring(iconTranslateY, { toValue: -3, damping: 12, stiffness: 160, useNativeDriver: true }),
                Animated.spring(iconScale, { toValue: 1.18, damping: 12, stiffness: 160, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(pillScale, { toValue: 0.5, damping: 14, stiffness: 180, useNativeDriver: true }),
                Animated.timing(pillOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.spring(iconTranslateY, { toValue: 0, damping: 14, stiffness: 180, useNativeDriver: true }),
                Animated.spring(iconScale, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: true }),
            ]).start();
        }
    }, [isFocused]);

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
    };

    const activeColor = colors.accentDark || colors.primary;
    const inactiveColor = colors.textLight;

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.tabItem}
        >
            <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, { transform: [{ scale: pressScale }] }]}>
                {/* Pill Background */}
                <Animated.View 
                    style={[
                        styles.pillBase,
                        {
                            opacity: pillOpacity,
                            transform: [{ scale: pillScale }]
                        }
                    ]} 
                />

                {/* Icon */}
                <Animated.View style={{ transform: [{ translateY: iconTranslateY }, { scale: iconScale }] }}>
                    <View>
                        <Ionicons 
                            name={iconName} 
                            size={22} 
                            color={isFocused ? activeColor : inactiveColor} 
                            style={{ zIndex: 1 }} 
                        />
                        {route.name === 'Profile' && isProUser && (
                            <View style={{ position: 'absolute', top: -10, alignSelf: 'center', zIndex: 2 }}>
                                <MaterialCommunityIcons name="crown" size={14} color={colors.warning} style={{
                                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                    textShadowOffset: {width: 0, height: 1},
                                    textShadowRadius: 2
                                }} />
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {
    return (
        <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
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

                    return (
                        <TabItem 
                            key={index} 
                            isFocused={isFocused} 
                            onPress={onPress} 
                            onLongPress={onLongPress} 
                            route={route} 
                        />
                    );
                })}
            </View>
        </View>
    );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      initialLayout={{ width: Dimensions.get('window').width }}
      screenOptions={{
        swipeEnabled: false,
        animationEnabled: true, // Enable smooth sliding animation
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
      <Tab.Screen name="Health" component={HealthHubScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return (
    <OfflineProvider>
      <SubscriptionProvider>
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
                 <Stack.Screen name="Food" component={FoodScreen} options={standardSlide} />
                 <Stack.Screen name="Medicine" component={MedicineScreen} options={standardSlide} />
                 <Stack.Screen name="Weight" component={WeightScreen} options={standardSlide} />
                 <Stack.Screen name="Reports" component={StatsScreen} options={standardSlide} />
              </>
            ) : (
              <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'fade' }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SubscriptionProvider>
    </OfflineProvider>
  );
};
