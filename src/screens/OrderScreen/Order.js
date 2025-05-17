import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Modal,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {instance} from '../../services/AxiosHolder/AxiosHolder';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const Order = () => {
  const navigation = useNavigation();

  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [order, setOrder] = useState([]);
  const [qty, setQty] = useState('1');
  const [productId, setProductId] = useState(null);
  const [cartList, setCartList] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [stockDtos, setStockDtos] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [productImages, setProductImages] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [collectingCash, setCollectingCash] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [cashAmount, setCashAmount] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await getProducts();
        await getStocks();
      } catch (error) {
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  async function getProducts() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await instance.get('/MegaMartLanka/items', config);
      setProducts(response.data);
      
      // Load images for all products
      const images = {};
      for (const product of response.data) {
        try {
          const imageUrl = await getProductImage(product.id, token);
          if (imageUrl) {
            images[product.id] = imageUrl;
          }
        } catch (err) {
          console.log(`Error loading image for product ${product.id}:`, err);
        }
      }
      setProductImages(images);
    } catch (error) {
      console.log(error.response?.data || error.message);
      throw error;
    }
  }

  const getProductImage = async (id, token) => {
    try {
      const response = await instance.get(
        `/MegaMartLanka/get/image/${id}`,
        {
          headers: {Authorization: `Bearer ${token}`},
          responseType: 'arraybuffer',
        },
      );

      if (response.data) {
        // Convert arraybuffer to base64
        const base64String = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        return `data:image/jpeg;base64,${base64String}`;
      }
      return null;
    } catch (err) {
      console.log(`Error loading image for product ${id}:`, err);
      return null;
    }
  };

  async function getStocks() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await instance.get('/MegaMartLanka/stock', config);
      setStocks(response.data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function getFromStock() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await instance.put('/MegaMartLanka/stock/getfrom', stockDtos, config);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function placeOrder() {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const data = {
        itemIds: order,
      };
      await instance.post('/MegaMartLanka/orders', data, config);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function submitOrder() {
    try {
      setLoading(true);
      await getFromStock();
      await placeOrder();
      Alert.alert('Success', 'Order placed successfully');
      resetOrder();
      navigation.navigate('Order');
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  function addToOrder(product) {
    const stockitem = stocks.find(stock => stock.item.id === product.id);
    const quantity = parseInt(qty) || 0;
    const price = product.price * quantity;

    if (!stockitem || stockitem.qoh < quantity) {
      setError('Not enough stock available');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be at least 1');
      return;
    }

    const newOrder = [...order];
    for (let i = 0; i < quantity; i++) {
      newOrder.push(product.id);
    }
    setOrder(newOrder);

    const existingItemIndex = cartList.findIndex(
      item => item.itemId === product.id,
    );

    if (existingItemIndex >= 0) {
      const updatedCart = [...cartList];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        qty: updatedCart[existingItemIndex].qty + quantity,
        price: updatedCart[existingItemIndex].price + price,
      };
      setCartList(updatedCart);

      const updatedStockDtos = [...stockDtos];
      const stockDtoIndex = updatedStockDtos.findIndex(
        dto => dto.id === stockitem.id,
      );
      if (stockDtoIndex >= 0) {
        updatedStockDtos[stockDtoIndex] = {
          ...updatedStockDtos[stockDtoIndex],
          qty: updatedStockDtos[stockDtoIndex].qty + quantity,
        };
        setStockDtos(updatedStockDtos);
      } else {
        setStockDtos([
          ...updatedStockDtos,
          {
            id: stockitem.id,
            qty: quantity,
          },
        ]);
      }
    } else {
      const newCartItem = {
        stockId: stockitem.id,
        itemId: product.id,
        name: product.name,
        description: product.description,
        qty: quantity,
        price: price,
      };
      setCartList([...cartList, newCartItem]);

      const newStockDto = {
        id: stockitem.id,
        qty: quantity,
      };
      setStockDtos([...stockDtos, newStockDto]);
    }

    setTotalPrice(totalPrice + price);
    setQty('1');
    setProductId(null);
    setError('');
  }

  function removeFromCart(cart) {
    const updatedOrder = order.filter(id => id !== cart.itemId);
    setOrder(updatedOrder);

    const updatedCart = cartList.filter(item => item.stockId !== cart.stockId);
    setCartList(updatedCart);

    const updatedStockDtos = stockDtos.filter(dto => dto.id !== cart.stockId);
    setStockDtos(updatedStockDtos);

    setTotalPrice(totalPrice - cart.price);
  }

  function resetOrder() {
    setOrder([]);
    setCartList([]);
    setStockDtos([]);
    setTotalPrice(0);
    setQty('1');
    setProductId(null);
    setIsCheckingOut(false);
    setCollectingCash(false);
    setCashCollected(false);
    setCashAmount('0');
    setError('');
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  }

  const renderProductItem = ({item}) => {
    const stockitem = stocks.find(stock => stock.item.id === item.id);
    const qoh = stockitem ? stockitem.qoh : 0;
    const imageUri = productImages[item.id];

    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          {imageUri ? (
            <Image 
              source={{uri: imageUri}} 
              style={styles.productImage}
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Icon name="image" size={40} color="#6d28d9" />
            </View>
          )}
        </View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.price)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>In Stock:</Text>
            <Text
              style={[
                styles.detailValue,
                qoh < 5 ? styles.lowStock : styles.highStock,
              ]}>
              {qoh}
            </Text>
          </View>
        </View>

        {productId === item.id ? (
          <View style={styles.quantityControls}>
            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={qty}
              onChangeText={text => {
                setQty(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="Qty"
              maxLength={3}
            />
            {error && productId === item.id && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={() => addToOrder(item)}>
              <Text style={styles.buttonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.selectButton]}
            onPress={() => {
              setProductId(item.id);
              setQty('1');
              setError('');
            }}>
            <Text style={styles.buttonText}>Select</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCartItem = ({item}) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemHeader}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <TouchableOpacity onPress={() => removeFromCart(item)}>
          <Icon name="close" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemDesc} numberOfLines={1}>
        {item.description}
      </Text>
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemQty}>
          {item.qty} × {formatCurrency(item.price / item.qty)}
        </Text>
        <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Modal
        visible={isCheckingOut}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCheckingOut(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsCheckingOut(false)}
              style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#6d28d9" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order Summary</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView style={styles.cartItemsContainer}>
            {cartList.length === 0 ? (
              <View style={styles.emptyCartModal}>
                <Icon name="remove-shopping-cart" size={60} color="#d1d5db" />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
              </View>
            ) : (
              cartList.map(cart => (
                <View key={cart.stockId} style={styles.checkoutItem}>
                  <View style={styles.checkoutItemHeader}>
                    <Text style={styles.checkoutItemName}>{cart.name}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(cart)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.checkoutItemDesc} numberOfLines={1}>
                    {cart.description}
                  </Text>
                  <View style={styles.checkoutItemFooter}>
                    <Text style={styles.checkoutItemQty}>Qty: {cart.qty}</Text>
                    <Text style={styles.checkoutItemPrice}>
                      {formatCurrency(cart.price)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {cartList.length > 0 && (
            <View style={styles.checkoutFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(totalPrice)}
                </Text>
              </View>

              {collectingCash ? (
                <View style={styles.cashInputContainer}>
                  <Text style={styles.cashInputLabel}>Enter Cash Amount</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={text =>
                      setCashAmount(text.replace(/[^0-9.]/g, ''))
                    }
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    autoFocus
                  />
                  <View style={styles.cashButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setCollectingCash(false);
                        setCashAmount('0');
                      }}>
                      <Text
                        style={[styles.buttonText, styles.cancelButtonText]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.confirmButton]}
                      onPress={() => {
                        const amount = parseFloat(cashAmount) || 0;
                        if (amount >= totalPrice) {
                          setCollectingCash(false);
                          setCashCollected(true);
                        } else {
                          Alert.alert(
                            'Insufficient Amount',
                            'The cash amount must be equal to or greater than the total.',
                          );
                        }
                      }}>
                      <Text style={styles.buttonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : cashCollected ? (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Cash Received:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(parseFloat(cashAmount) || 0)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Change Due:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(
                        (parseFloat(cashAmount) || 0) - totalPrice,
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.button, styles.completeButton]}
                    onPress={submitOrder}
                    disabled={loading}>
                    <Text style={styles.buttonText}>
                      {loading ? 'Processing...' : 'Complete Order'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.paymentButton]}
                  onPress={() => setCollectingCash(true)}>
                  <Text style={styles.buttonText}>Process Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="#6d28d9"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setIsCartOpen(!isCartOpen)}>
          <Icon name="shopping-cart" size={24} color="white" />
          {cartList.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Icon name="refresh" size={30} color="#6d28d9" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {isCartOpen ? (
          <View style={styles.splitView}>
            <View style={styles.productsColumn}>
              <FlatList
                data={products.filter(
                  product =>
                    product.name.toLowerCase().includes(search.toLowerCase()) ||
                    product.description
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )}
                renderItem={renderProductItem}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.productGrid}
                showsVerticalScrollIndicator={false}
              />
            </View>
            <View style={styles.cartColumn}>
              <View style={styles.cartContainer}>
                <View style={styles.cartHeader}>
                  <Text style={styles.cartTitle}>Your Cart</Text>
                  <Text style={styles.cartCount}>{cartList.length} items</Text>
                </View>

                {cartList.length > 0 ? (
                  <>
                    <FlatList
                      data={cartList}
                      renderItem={renderCartItem}
                      keyExtractor={item => item.stockId.toString()}
                      contentContainerStyle={styles.cartItems}
                      showsVerticalScrollIndicator={false}
                    />
                    <View style={styles.cartTotal}>
                      <Text style={styles.totalText}>Total:</Text>
                      <Text style={styles.totalAmount}>
                        {formatCurrency(totalPrice)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, styles.checkoutButton]}
                      onPress={() => setIsCheckingOut(true)}
                      disabled={cartList.length === 0}>
                      <Text style={styles.buttonText}>Checkout</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptyCart}>
                    <Icon name="remove-shopping-cart" size={50} color="#d1d5db" />
                    <Text style={styles.emptyCartText}>Your cart is empty</Text>
                    <Text style={styles.emptyCartSubtext}>
                      Select items to add to your cart
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={products.filter(
              product =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.description
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )}
            renderItem={renderProductItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.productGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    color: '#6d28d9',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#4b5563',
    fontSize: 16,
  },
  cartButton: {
    backgroundColor: '#6d28d9',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  productsColumn: {
    flex: 2,
    paddingRight: 5,
  },
  cartColumn: {
    flex: 1,
    paddingLeft: 5,
  },
  productGrid: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: (width - 40) / 2,
  },
  productImageContainer: {
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b21b6',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  productDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7c3aed',
  },
  detailValue: {
    fontSize: 12,
    color: '#4b5563',
  },
  highStock: {
    color: '#10b981',
  },
  lowStock: {
    color: '#ef4444',
  },
  quantityControls: {
    marginTop: 5,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    backgroundColor: '#faf5ff',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: '#6d28d9',
  },
  addButton: {
    backgroundColor: '#10b981',
  },
  checkoutButton: {
    backgroundColor: '#6d28d9',
    marginTop: 10,
  },
  cartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ede9fe',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5b21b6',
  },
  cartCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartItems: {
    flexGrow: 1,
  },
  cartItem: {
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5b21b6',
    flex: 1,
    marginRight: 10,
  },
  cartItemDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  cartItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemQty: {
    fontSize: 12,
    color: '#6b7280',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b21b6',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b21b6',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b21b6',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  emptyCartSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5b21b6',
    textAlign: 'center',
    flex: 1,
  },
  cartItemsContainer: {
    flex: 1,
    padding: 15,
  },
  emptyCartModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  checkoutItem: {
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  checkoutItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkoutItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b21b6',
    flex: 1,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  checkoutItemDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  checkoutItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkoutItemQty: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkoutItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b21b6',
  },
  checkoutFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5b21b6',
  },
  cashInputContainer: {
    marginTop: 15,
  },
  cashInputLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#faf5ff',
    fontSize: 16,
  },
  cashButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#6d28d9',
    flex: 1,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6d28d9',
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#6d28d9',
  },
  paymentButton: {
    backgroundColor: '#6d28d9',
    marginTop: 15,
  },
  completeButton: {
    backgroundColor: '#10b981',
    marginTop: 15,
  },
});

export default Order;