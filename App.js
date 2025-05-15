import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/LoginScreen/Login';
import SignUpScreen from './src/screens/SignUpScreen/SignUp';
import MyTabs from './src/comon/MyTabBar/MyTabBar';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { 
            height: 0,
            display: 'none'
          }
        }}
      >
        <Tab.Screen 
          name="login" 
          component={LoginScreen} 
          options={{
            tabBarButton: () => null,
          }}
        />
        <Tab.Screen 
          name="signup" 
          component={SignUpScreen} 
          options={{
            tabBarButton: () => null,
          }}
        />
        <Tab.Screen 
          name="menu" 
          component={MyTabs} 
          options={{
            tabBarButton: () => null,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}