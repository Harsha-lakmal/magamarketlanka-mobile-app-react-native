import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {instance} from '../../services/AxiosHolder/AxiosHolder';

const About = () => {
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState({
    username: '',
    role: '',
    fullname: '',
    password: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);

  const navigation = useNavigation();
  const username = AsyncStorage.getItem('username');
  const token = AsyncStorage.getItem('jwtToken');

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      setLoading(true);

      const username = await AsyncStorage.getItem('username');
      const token = await AsyncStorage.getItem('jwtToken');

      if (!username || !token) {
        throw new Error('Missing token or username');
      }

      const response = await instance.get(
        `/MegaMartLanka/user/getName/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response.data);

      setUserData({
        id: response.data.id,
        username: response.data.username,
        fullname: response.data.fullname || '',
        password: '............',
        role: response.data.userType,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  function test() {
    console.log(userData);
  }
  const pickImage = imageType => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
      selectionLimit: 1,
    };

    ImagePicker.launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];

        if (selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(selectedImage.type)) {
          Alert.alert('Error', 'Only JPEG, JPG, and PNG images are allowed');
          return;
        }

        try {
          if (imageType === 'cover') {
            await uploadCoverImg(selectedImage);
          } else if (imageType === 'profile') {
            await uploadProfileImg(selectedImage);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    });
  };

  const deleteAccount = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              await instance.delete(`/api/v1/MegaMartLanka/users/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              Alert.alert('Success', 'Your account has been deleted');
              handleLogout();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const updateDetails = async () => {
    try {
      setLoading(true);
      const data = {
        username: userData.username,
        fullname: userData.fullname,
        password: userData.password || undefined, // Only send password if changed
      };

      await instance.put(`/api/v1/MegaMartLanka/updateUser/${userId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const uploadCoverImg = async file => {
    const id = userData.id;
    const token = await AsyncStorage.getItem('jwtToken');

    if (!id || !file || !token) {
      Alert.alert('Error', 'Required information is missing');
      return;
    }

    setCoverImageLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `cover-${Date.now()}.jpg`,
    });

    try {
      const response = await instance.post(
        `/MegaMartLanka/uploadCover/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      console.log(response.data);

      if (response.data) {
        await getCoverImage(id, token);
        Alert.alert('Success', 'Cover image uploaded successfully');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to upload cover image';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      console.error('Error uploading cover image:', err.response || err);
    } finally {
      setCoverImageLoading(false);
    }
  };

  const uploadProfileImg = async file => {
    const id = userData.id;
    const token = await AsyncStorage.getItem('jwtToken');

    if (!id || !file || !token) {
      Alert.alert('Error', 'Required information is missing');
      return;
    }

    setProfileImageLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `profile-${Date.now()}.jpg`,
    });

    try {
      const response = await instance.post(
        `/MegaMartLanka/uploadProfile/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        await getProfileImage(id, token);
        Alert.alert('Success', 'Profile image uploaded successfully');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to upload profile image';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      console.error('Error uploading profile image:', err.response || err);
    } finally {
      setProfileImageLoading(false);
    }
  };

  const getCoverImage = async () => {
    const id = userData.id;
    const token = await AsyncStorage.getItem('jwtToken');

    if (!id || !token) return;

    setCoverImageLoading(true);
    setError('');

    try {
      const response = await instance.get(
        `/MegaMartLanka/get/imageCover/${id}`,
        {
          headers: {Authorization: `Bearer ${token}`},
          responseType: 'blob',
        },
      );

      if (response.data) {
        const blob = response.data;
        const reader = new FileReader();
        reader.onload = () => {
          setCoverImage({uri: reader.result});
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      setCoverImage(null);
    } finally {
      setCoverImageLoading(false);
    }
  };

  const getProfileImage = async () => {
    const id = userData.id;
    const token = await AsyncStorage.getItem('jwtToken');

    if (!id || !token) return;

    setProfileImageLoading(true);
    setError('');

    try {
      const response = await instance.get(
        `/MegaMartLanka/get/imageProfile/${id}`,
        {
          headers: {Authorization: `Bearer ${token}`},
          responseType: 'blob',
        },
      );

      if (response.data) {
        const blob = response.data;
        const reader = new FileReader();
        reader.onload = () => {
          setProfileImage({uri: reader.result});
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      // It's okay if profile image doesn't exist
      setProfileImage(null);
    } finally {
      setProfileImageLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['jwtToken', 'userId']);
      navigation.reset({
        index: 0,
        routes: [{name: 'login'}],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => pickImage('cover')}
          style={styles.coverImageContainer}>
          {coverImageLoading ? (
            <View style={styles.imageLoading}>
              <ActivityIndicator size="large" color="#007bff" />
            </View>
          ) : (
            <Image
              source={
                coverImage?.uri
                  ? {uri: coverImage.uri}
                  : require('../../assets/magamarketlk.png')
              }
              style={styles.coverImage}
              resizeMode="cover"
              onError={() => setCoverImage(null)}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage('profile')}
          style={styles.profileImageContainer}>
          {profileImageLoading ? (
            <View style={styles.imageLoading}>
              <ActivityIndicator size="large" color="#007bff" />
            </View>
          ) : (
            <Image
              source={
                profileImage?.uri
                  ? {uri: profileImage.uri}
                  : require('../../assets/magamarketlk.png')
              }
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => setProfileImage(null)}
            />
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Username</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={userData.username}
                onChangeText={text => handleInputChange('username', text)}
              />
            ) : (
              <Text style={styles.value}>{userData.username}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={userData.fullname}
                onChangeText={text => handleInputChange('fullName', text)}
              />
            ) : (
              <Text style={styles.value}>{userData.fullname || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={userData.role}
                onChangeText={text => handleInputChange('role', text)}
              />
            ) : (
              <Text style={styles.value}>{userData.role}</Text>
            )}
          </View>

          {editMode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={userData.password}
                onChangeText={text => handleInputChange('password', text)}
                secureTextEntry
                placeholder="Leave empty to keep current"
              />
            </View>
          )}
        </View>

        <View style={styles.buttonWrapper}>
          {editMode ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={updateDetails}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditMode(false)}
                disabled={loading}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setEditMode(true)}>
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={deleteAccount}>
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={getCoverImage}>
                <Text style={styles.buttonText}>test</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingBottom: 100,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#ddd',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -60,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  logoutButton: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    width: '30%',
  },
  value: {
    fontSize: 16,
    color: '#333',
    width: '65%',
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#333',
    width: '65%',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  bottomPadding: {
    height: 20,
  },
});

export default About;
