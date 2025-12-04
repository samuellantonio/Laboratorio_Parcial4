import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen({ navigation }) {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      
      if (!compatible) {
        Alert.alert(
          'Biometría no disponible',
          'Tu dispositivo no soporta autenticación biométrica. Puedes continuar sin ella.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasEnrolled && isBiometricSupported) {
        Alert.alert(
          'No hay biometría registrada',
          'Por favor configura tu huella digital o Face ID en los ajustes del dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Continuar sin biometría',
              onPress: () => navigation.replace('Home')
            }
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate para acceder a tu billetera',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña del dispositivo'
      });

      if (result.success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Error', 'Autenticación fallida. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      Alert.alert('Error', 'No se pudo realizar la autenticación');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSkipAuth = () => {
    Alert.alert(
      'Omitir autenticación',
      '¿Deseas entrar sin autenticación biométrica?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, continuar',
          onPress: () => navigation.replace('Home')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo de Mi Billetera */}
        <Image 
          source={require('../../assets/Mi_Billetera.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Mi Billetera Digital</Text>
        <Text style={styles.subtitle}>Universitaria</Text>
        
        <TouchableOpacity
          style={[
            styles.biometricButton,
            isAuthenticating && styles.buttonDisabled
          ]}
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          <Text style={styles.biometricIcon}>
            {isAuthenticating ? '⏳' : '🔐'}
          </Text>
          <Text style={styles.biometricText}>
            {isAuthenticating ? 'Autenticando...' : 'Autenticar con Biometría'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {isBiometricSupported
            ? 'Usa tu huella digital o Face ID para acceder'
            : 'Biometría no disponible en este dispositivo'}
        </Text>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipAuth}
        >
          <Text style={styles.skipText}>Omitir autenticación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 20,
    color: '#7f8c8d',
    marginBottom: 50,
  },
  biometricButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  biometricText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    color: '#95a5a6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});