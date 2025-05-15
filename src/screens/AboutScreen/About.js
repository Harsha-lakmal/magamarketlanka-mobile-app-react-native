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
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import FilePickerManager from 'react-native-file-picker';
import {instance} from '../../services/AxiosHolder/AxiosHolder';
import { tokens } from 'react-native-paper/lib/typescript/styles/themes/v3/tokens';

const About = () => {
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const navigation = useNavigation();
  const username  =  AsyncStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        const storedToken = await AsyncStorage.getItem('jwtToken');
        console.log(storedToken);
        

        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setUserId(parsedUserData.id);
        }

        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userId && token) {
      getCoverImage();
      getProfileImage();
    }
  }, [userId, token]);

  const pickImage = setImage => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
      selectionLimit: 1,
    };

    function getUserData(){
      try{
        instance.get('/api/v1/MegaMartLanka/user/getName/'+username ,  {
          headers : {
            Authorization : `Bearer ${token}`
          }
        })
        .then(response =>{
          console.log(response);
          
        }).catch(err =>{
          console.log(err);
          
        })

      } catch(error){
        console.log(error);
        


      }
    }

    ImagePicker.launchImageLibrary(options, response => {
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

        setImage(selectedImage);

        if (setImage === setCoverImage) {
          uploadCoverImg(selectedImage);
        } else if (setImage === setProfileImage) {
          uploadProfileImg(selectedImage);
        }
      }
    });
  };

  };

  function  deleteAccount(){
    try{
        instance.delete('/MegaMartLanka/users/'_+id  , {
          headers :{
            Authorization : `Bearer ${tokens}`
          }
        }).then(respose =>{
          console.log("Your Account delete Susses");
          handleLogout();
          
        }).catch (err =>{
          console.log("error ");
          
        })
    }catch(err){
      console.log(err);
      

    }
  }

  function updateDetils(){
    const data  = {
      username   , 
      fullname , 
      password
    }
    try {
      instance.put("/MegaMartLanka/updateUser/"+id , data  ,  {
        headers : {
          Authorization : `Bearer ${tokens}`
        } 
      })

    }catch(err){

    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('token');
      Alert.alert('Success', 'Logged out successfully');
      navigation.reset({
        index: 0,
        routes: [{name: 'login'}],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const uploadCoverImg = async file => {
    if (!userId || !file) {
      Alert.alert('Error', 'User ID or file is missing');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `cover-${Date.now()}.jpg`,
    });

    try {
      const response = await instance.post(
        `/user/uploadCover/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        await getCoverImage();
        Alert.alert('Success', 'Cover image uploaded successfully');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to upload cover image';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      console.error('Error uploading cover image:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImg = async file => {
    if (!userId || !file) {
      Alert.alert('Error', 'User ID or file is missing');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `profile-${Date.now()}.jpg`,
    });

    try {
      const response = await instance.post(`/MegaMartLanka/uploadProfile/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        await getProfileImage();
        Alert.alert('Success', 'Profile image uploaded successfully');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to upload profile image';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      console.error('Error uploading profile image:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  getCoverImage = async () => {
    if (!userId || !token) return;

    setCoverImageLoading(true);
    setError('');

    try {
      const response = await instance.get(`/MegaMartLanka/get/imageProfile/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
        responseType: 'blob',
      });

      if (response.data) {
        const blob = response.data;
        const reader = new FileReader();
        reader.onload = () => {
          setCoverImage({uri: reader.result});
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load cover image';
      setError(errorMsg);
      console.error('Error fetching cover image:', err.response || err);
    } finally {
      setCoverImageLoading(false);
    }
  };

  const getProfileImage = async () => {
    if (!userId || !token) return;

    setProfileImageLoading(true);
    setError('');

    try {
      const response = await instance.get(`/MegaMartLanka/get/imageProfile/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
        responseType: 'blob',
      });

      if (response.data) {
        const blob = response.data;
        const reader = new FileReader();
        reader.onload = () => {
          setProfileImage({uri: reader.result});
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load profile image';
      setError(errorMsg);
      console.error('Error fetching profile image:', err.response || err);
    } finally {
      setProfileImageLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => pickImage(setCoverImage)}
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
              onError={e => {
                console.log('Cover image error:', e.nativeEvent.error);
                setCoverImage(null);
              }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage(setProfileImage)}
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
              onError={e => {
                console.log('Profile image error:', e.nativeEvent.error);
                setProfileImage(null);
              }}
            />
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          {userData && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{userData.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{userData.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{userData.role}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.value}>••••••</Text>
              </View>
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
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 100,
  },
  coverImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    borderRadius: 60,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 30,
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: 'red',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    zIndex: 2000,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  bottomPadding: {
    height: 80,
  },
});

export default About;
