import React from 'react';
import { View, Image } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileIcon from '../../assets/profile.png';
import HomeIcon from '../../assets/Home.png';
import OrderIcon from '../../assets/orders.png';
import StockIcon from '../../assets/stock.png';

import HomeScreen from '../../screens/HomeScreen/Home';
import ProfileScreen from '../../screens/AboutScreen/About';
import StockScreen from '../../screens/StockScreen/Stock';
import OrderScreen from '../../screens/OrderScreen/Order';

const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  const iconImages = {
    Home: HomeIcon,
    Profile: ProfileIcon,
    Stock: StockIcon,
    Order: OrderIcon,
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      height: 70, 
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
            href={buildHref(route.name)}
          >
            <Image 
              source={iconSource} 
              style={{ 
                width: 40,  // Increased size further
                height: 40, // Increased size further
                tintColor: isFocused ? colors.primary : colors.text,
              }} 
            />
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