import React from 'react';
import { View, Platform, Image } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileIcon from '../../asstes/profile.png';
import HomeIcon from '../../asstes/Home.png';
import OrderIcon from '../../asstes/orders.png';
import StockIcon from '../../asstes/stock.png';

import HomeScreen from '../../srceen/HomeScreen/Home';
import ProfileScreen from '../../srceen/AboutScreen/About';
import StockScreen from '../../srceen/StockScreen/Stock';
import OrderScreen from '../../srceen/OrderScreen/Order';

const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  // Icon images for each tab
  const iconImages = {
    Home: HomeIcon,
    Profile: ProfileIcon,
    Stock: StockIcon,
    Order: OrderIcon,
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      height: 60, 
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconSource = iconImages[route.name];

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
          <PlatformPressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
            }}
          >
            <Image 
              source={iconSource} 
              style={{ 
                width: 24, 
                height: 24, 
                tintColor: isFocused ? colors.primary : colors.text,
                marginBottom: 4 
              }} 
            />
            <Text 
              style={{ 
                fontSize: 12,
                color: isFocused ? colors.primary : colors.text 
              }}
            >
              {route.name}
            </Text>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

export default function MyTabs() {
  return (
    <Tab.Navigator 
      tabBar={(props) => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Order" component={OrderScreen} />
    </Tab.Navigator>
  );
}