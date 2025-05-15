import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {instance} from '../../services/AxiosHolder/AxiosHolder';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function showSuccess() {
    Alert.alert('Success', 'You have successfully logged in.');
  }

  function showError(message) {
    Alert.alert('Error', message || 'An error occurred during login.');
  }

  const submit = async () => {
    if (username === '' || password === '') {
      setError('Username and Password are required');
      return;
    }

    const data = {username, password};

    try {
      setIsLoading(true);
      const response = await instance.post('/MegaMartLanka/login', data);
      showSuccess();

      console.log(response);

      if (response.data.usertype === 'user') {
        AsyncStorage.setItem('jwtToken', response.data.jwtToken);
        AsyncStorage.setItem('username' ,  response.data.username)

        navigation.navigate('menu');
      } else {
        Alert.alert('Error ', 'This use User only & Try Again ');
      }
    } catch (err) {
      console.log(err);

      const errorMessage =
        err.response?.data?.message || 'Invalid username or password';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.box}>
            <Image
              source={require('../../assets/magamarketlk.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Please enter your credentials</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={text => {
                setUsername(text);
                setError('');
              }}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError('');
              }}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={submit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={() => navigation.navigate('signup')}>
              <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.link}>Contact admin</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    height: 1000,
    top: 150,
  },
  keyboardAvoidingView: {},
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0369a1',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748b',
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    textAlign: 'center',
    fontSize: 13,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  button: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0284c7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  signupButton: {
    backgroundColor: '#0369a1',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  link: {
    color: '#0284c7',
    fontWeight: '500',
  },
});
