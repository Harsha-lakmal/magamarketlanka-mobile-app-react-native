import {View, Text, TouchableOpacity} from 'react-native';
import {instance} from '../../services/AxiosHolder/AxiosHolder';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  function gettCategory() {
    const token = AsyncStorage.getItem('jwtToken');
    try {
      instance.get('/MegaMartLanka/category', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <View>
      <Text>Home page </Text>
      <TouchableOpacity onPress={gettCategory}>
        <Text>Test </Text>
      </TouchableOpacity>
    </View>
  );
}
