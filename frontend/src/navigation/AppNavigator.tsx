import React from 'react';
import { Text } from 'react-native';
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

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddEmployee: undefined;
  FaceRegister: { employeeId: string; employeeName: string };
  // AttendanceCamera requires mode param — accessed via stack only, not tab
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
      // Fixed: TabIcon now renders actual emoji content
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Text style={{ fontSize: size - 4, color }}>{TAB_ICONS[route.name] ?? '•'}</Text>
      ),
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
    <Tab.Screen name="Employees" component={EmployeeListScreen} options={{ tabBarLabel: 'Employees' }} />
    {/* History replaces Attendance tab — camera screens need params so they must be accessed from Dashboard */}
    <Tab.Screen name="History" component={AttendanceHistoryScreen} options={{ tabBarLabel: 'History' }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Login"
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

export default AppNavigator;
