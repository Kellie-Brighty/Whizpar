import * as LocalAuthentication from 'expo-local-authentication';

export const checkBiometricAvailability = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
};

export const authenticateWithBiometrics = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch (error) {
    return false;
  }
}; 