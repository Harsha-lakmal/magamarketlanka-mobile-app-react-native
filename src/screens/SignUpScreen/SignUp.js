import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { instance } from '../../services/AxiosHolder/AxiosHolder';

export default function SignUp() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [fullname, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    function showSuccess() {
        Alert.alert(
            "Success", 
            "Your account has been created successfully!",
            [
                { 
                    text: "OK", 
                    onPress: () => navigation.navigate('login') 
                }
            ]
        );
    }

    function  clear(){
        setConfirmPassword("");
        setError("");
        setFullName("");
        setUsername("");
        setPassword("");
    }

    function showError(message) {
        Alert.alert("Error", message || "An error occurred during sign up.");
    }

    const validateForm = () => {
        if (!username || !fullname || !password || !confirmPassword) {
            setError('All fields are required');
            return false;
        }
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        
        return true;
    };

    const submit = async () => {
        if (!validateForm()) {
            return;
        }

        const data = { 
            username, 
            fullname, 
            password,
            userType: "user", 
            coverImgPath: "null",  
            profileImgPath: "null"
        };

        try {
            setIsLoading(true);
            console.log("Sending data:", data);
            
            const response = await instance.post("/MegaMartLanka/AddUsers", data); 
            
            showSuccess();
            clear();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
            clear();
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
                style={styles.keyboardAvoidingView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.box}>
                        <Image 
                            source={require('../../assets/magamarketlk.png')} 
                            style={styles.logo} 
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Please fill in your details</Text>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            value={username}
                            onChangeText={(text) => {
                                setUsername(text);
                                setError('');
                            }}
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={fullname}
                            onChangeText={(text) => {
                                setFullName(text);
                                setError('');
                            }}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError('');
                            }}
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setError('');
                            }}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={submit} 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={() => navigation.navigate('login')}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>
                            Already have an account? {' '}
                            <Text 
                                style={styles.link}
                                onPress={() => navigation.navigate('login')}
                            >
                                Sign in
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        top: 12
    },
    keyboardAvoidingView: {
        height: 1000 
    },
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
        shadowColor: "#000",
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
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0369a1',
        textAlign: 'center',
        marginBottom: 8
    },
    subtitle: {
        color: '#64748b',
        marginBottom: 20,
        fontSize: 14,
        textAlign: 'center'
    },
    errorText: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        width: '100%',
        textAlign: 'center',
        fontSize: 13
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
        backgroundColor: '#f8fafc'
    },
    button: {
        width: '100%',
        backgroundColor: '#0284c7',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3
    },
    cancelButton: {
        backgroundColor: '#94a3b8',
        marginBottom: 16
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center'
    },
    link: {
        color: '#0284c7',
        fontWeight: '500'
    }
});