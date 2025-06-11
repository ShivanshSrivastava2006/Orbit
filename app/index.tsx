import { useEffect } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 50); // gives time for layout to mount

    return () => clearTimeout(timer);
  }, []);

  return <Text>Redirecting...</Text>;
}
