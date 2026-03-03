import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text } from 'react-native';

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
import { FoodScreen } from '../screens/FoodScreen';
import { MedicineScreen } from '../screens/MedicineScreen';
import { WeightScreen } from '../screens/WeightScreen';
import { HealthHubScreen } from '../screens/HealthHubScreen';
import { OfflineProvider } from '../context/OfflineContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';

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
    Health: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<TabParamList>();

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TAB_CONFIG: Record<string, { focused: any; outline: any; label: string }> = {
    Home: { focused: 'home', outline: 'home-outline', label: 'Home' },
    Calendar: { focused: 'calendar', outline: 'calendar-outline', label: 'Schedule' },
    Health: { focused: 'heart', outline: 'heart-outline', label: 'Health' },
    Profile: { focused: 'person', outline: 'person-outline', label: 'Profile' },
};

// ─────────────────────────────────────────────────────────────────────────────
// TabItem
// ─────────────────────────────────────────────────────────────────────────────

const TabItem = ({ isFocused, onPress, onLongPress, route }: any) => {
    const { isProUser } = useSubscription();
    const cfg = TAB_CONFIG[route.name] ?? TAB_CONFIG.Home;

    // Animation refs
    const labelOpacity = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
    const labelTranslateX = React.useRef(new Animated.Value(isFocused ? 0 : -6)).current;
    const chipWidth = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current; // 0→1 scale-x
    const iconScale = React.useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;
    const pressScale = React.useRef(new Animated.Value(1)).current;
    const iconColor = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    React.useEffect(() => {
        const spring = (val: Animated.Value, to: number, stiffness = 200, damping = 18) =>
            Animated.spring(val, { toValue: to, stiffness, damping, useNativeDriver: true });
        const timing = (val: Animated.Value, to: number, dur = 180) =>
            Animated.timing(val, { toValue: to, duration: dur, useNativeDriver: true });

        if (isFocused) {
            Animated.parallel([
                spring(iconScale, 1.1, 220, 16),
                spring(labelOpacity, 1, 220, 20),
                spring(labelTranslateX, 0, 220, 18),
                spring(chipWidth, 1, 180, 18),
                timing(iconColor, 1),
            ]).start();
        } else {
            Animated.parallel([
                spring(iconScale, 1, 200, 20),
                timing(labelOpacity, 0, 140),
                spring(labelTranslateX, -6, 200, 20),
                timing(chipWidth, 0, 160),
                timing(iconColor, 0),
            ]).start();
        }
    }, [isFocused]);

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, stiffness: 400, damping: 20 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, stiffness: 300, damping: 14 }).start();
    };

    const handlePress = () => {
        if (isFocused) {
            // Double-tap on active tab → medium haptic (scroll-to-top hint)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLongPress();
    };

    const activeColor = colors.accentDark;
    const inactiveColor = colors.textSecondary;

    // Interpolate icon color from inactive→active
    const animatedIconColor = iconColor.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveColor, activeColor],
    });

    // Chip width: scale from 0→chip full width (we use scaleX on a fixed-width container)
    const chipScaleX = chipWidth.interpolate({
        inputRange: [0, 1],
        outputRange: [0.01, 1],
        extrapolate: 'clamp',
    });

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={tabStyles.tabItem}
            accessibilityRole="button"
            accessibilityLabel={cfg.label}
            accessibilityState={{ selected: isFocused }}
        >
            <Animated.View style={[tabStyles.itemInner, { transform: [{ scale: pressScale }] }]}>
                {/* ── Pill chip (active indicator) ── */}
                <Animated.View
                    style={[
                        tabStyles.chip,
                        { transform: [{ scaleX: chipScaleX }] },
                    ]}
                />

                {/* ── Icon + Label row ── */}
                <Animated.View
                    style={[
                        tabStyles.iconLabelRow,
                        { transform: [{ scale: iconScale }] },
                    ]}
                >
                    {/* Icon */}
                    <Animated.View>
                        <Ionicons
                            name={isFocused ? cfg.focused : cfg.outline}
                            size={21}
                            color={isFocused ? activeColor : inactiveColor}
                        />
                        {/* Crown for pro users on Profile */}
                        {route.name === 'Profile' && isProUser && (
                            <View style={tabStyles.crown}>
                                <MaterialCommunityIcons
                                    name="crown"
                                    size={11}
                                    color={colors.premium}
                                />
                            </View>
                        )}
                    </Animated.View>

                    {/* Label — slides in when focused */}
                    <Animated.Text
                        style={[
                            tabStyles.label,
                            {
                                opacity: labelOpacity,
                                transform: [{ translateX: labelTranslateX }],
                                color: activeColor,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {cfg.label}
                    </Animated.Text>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CustomTabBar
// ─────────────────────────────────────────────────────────────────────────────

const CustomTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {
    return (
        <View style={tabStyles.tabBarOuter} pointerEvents="box-none">
            <View style={tabStyles.tabBar}>
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
                        navigation.emit({ type: 'tabLongPress', target: route.key });
                    };

                    return (
                        <TabItem
                            key={route.key}
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

// ─────────────────────────────────────────────────────────────────────────────
// MainTabs
// ─────────────────────────────────────────────────────────────────────────────

const MainTabs = () => (
    <Tab.Navigator
        tabBarPosition="bottom"
        initialLayout={{ width: Dimensions.get('window').width }}
        screenOptions={{
            swipeEnabled: false,
            animationEnabled: true,
            tabBarStyle: { display: 'none' },
            tabBarIndicatorStyle: { display: 'none' },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
    >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Health" component={HealthHubScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

// ─────────────────────────────────────────────────────────────────────────────
// AppNavigator
// ─────────────────────────────────────────────────────────────────────────────

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
                            ...standardSlide,
                        }}
                    >
                        {isSignedIn ? (
                            <>
                                <Stack.Screen name="MainTabs" component={MainTabs} />
                                <Stack.Screen name="AddTask" component={AddTaskScreen} options={modalSlide} />
                                <Stack.Screen name="HealthCheckIn" component={HealthCheckInScreen} options={modalSlide} />
                                <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={standardSlide} />
                                <Stack.Screen name="Premium" component={PremiumScreen} options={modalSlide} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
    tabBarOuter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.s,
        borderTopRightRadius: borderRadius.s,
        height: 84,
        paddingBottom: 20, // To accommodate bottom safe area
        paddingHorizontal: 6,
        // Layered shadow for premium floating feel
        // shadowColor: '#1A1400',
        // shadowOffset: { width: 0, height: -4 },
        // shadowOpacity: 0.10,
        // shadowRadius: 16,
        // elevation: 12,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border + '80',
    },

    // Each tap target
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },

    // Inner wrapper (receives the press scale)
    itemInner: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minWidth: 44,
        height: 44,
    },

    // Expanding pill chip that slides behind the icon+label
    chip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.accentSoft, // '#ECFDF5' — soft emerald tint
        borderRadius: borderRadius.round,
    },

    // Icon + label in a tight horizontal row
    iconLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        zIndex: 1,
    },

    // Animated label shown only when focused
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.1,
        // color is animated inline
    },

    // Pro crown badge
    crown: {
        position: 'absolute',
        top: -6,
        right: -2,
        zIndex: 2,
        transform: [{ rotate: '20deg' }],
    },
});