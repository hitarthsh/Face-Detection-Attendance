import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import AddEmployeeScreen from '../screens/AddEmployeeScreen';
import FaceRegisterScreen from '../screens/FaceRegisterScreen';
import AttendanceCameraScreen from '../screens/AttendanceCameraScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import { authService } from '../services/auth.service';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddEmployee: undefined;
  FaceRegister: { employeeId: string; employeeName: string };
  AttendanceCamera: { mode: 'checkin' | 'checkout' };
};

export type TabParamList = {
  Dashboard: undefined;
  Employees: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '📊',
  Employees: '👥',
  History: '📋',
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1C1C2E',
        borderTopColor: '#2D2D3F',
        height: 65,
        paddingBottom: 10,
      },
      tabBarActiveTintColor: '#6C63FF',
      tabBarInactiveTintColor: '#888',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Text style={{ fontSize: size - 4, color }}>{TAB_ICONS[route.name] ?? '•'}</Text>
      ),
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
    <Tab.Screen name="Employees" component={EmployeeListScreen} options={{ tabBarLabel: 'Employees' }} />
    <Tab.Screen name="History" component={AttendanceHistoryScreen} options={{ tabBarLabel: 'History' }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerStyle: { backgroundColor: '#1C1C2E' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' as const },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddEmployee"
          component={AddEmployeeScreen}
          options={{ title: 'Add Employee' }}
        />
        <Stack.Screen
          name="FaceRegister"
          component={FaceRegisterScreen}
          options={{ title: 'Register Face' }}
        />
        <Stack.Screen
          name="AttendanceCamera"
          component={AttendanceCameraScreen}
          options={({ route }) => ({
            title: route.params?.mode === 'checkin' ? 'Check In' : 'Check Out',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
