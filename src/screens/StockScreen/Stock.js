import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {instance} from '../../services/AxiosHolder/AxiosHolder';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import OrderScreen from '../OrderScreen/Order';

export default function Stock() {
  const navigation = useNavigation();
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    fetchStockData();
  }, []);

  async function fetchStockData() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await instance.get('/MegaMartLanka/items', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStockItems(response.data);
      fetchAllImages(response.data);
    } catch (err) {
      console.log('Error fetching stock:', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchAllImages = async (items) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const urls = {};
      
      // Create an array of promises for all image requests
      const imagePromises = items.map(async (item) => {
        if (item.id) {
          try {
            const response = await instance.get(
              `/MegaMartLanka/get/image/${item.id}`,
              {
                headers: {Authorization: `Bearer ${token}`},
                responseType: 'blob',
              },
            );

            if (response.data) {
              // Create a local URL for the blob
              const reader = new FileReader();
              return new Promise((resolve) => {
                reader.onload = () => {
                  urls[item.id] = reader.result;
                  resolve();
                };
                reader.readAsDataURL(response.data);
              });
            }
          } catch (err) {
            console.log(`Error fetching image for item ${item.id}:`, err);
            urls[item.id] = null;
            return Promise.resolve();
          }
        }
        return Promise.resolve();
      });

      // Wait for all images to load
      await Promise.all(imagePromises);
      setImageUrls({...urls});
    } catch (error) {
      console.log('Error in fetchAllImages:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStockData();
  };

  const handleOrderPress = (item) => {
    navigation.navigate('order', { item });
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      {imageUrls[item.id] ? (
        <Image
          source={{uri: imageUrls[item.id]}}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text>No Image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.priceCategoryContainer}>
          <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
          <Text style={styles.cardCategory}>{item.category.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.orderButton} 
          onPress={() => handleOrderPress(item)}
        >
          <Text style={styles.orderButtonText}>Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stock Inventory</Text>
      <FlatList
        data={stockItems}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    height: 180,
    width: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e86de',
  },
  cardCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  orderButton: {
    backgroundColor: '#2e86de',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});