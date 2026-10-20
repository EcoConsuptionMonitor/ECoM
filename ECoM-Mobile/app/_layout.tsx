import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/auth';
import { cores } from '../src/styles/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RaizNavegacao() {
  const { carregando, autenticado } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;

    SplashScreen.hideAsync().catch(() => {});

    const emRotaAuth = segmentos[0] === '(auth)';
    if (!autenticado && !emRotaAuth) {
      router.replace('/(auth)/welcome');
    } else if (autenticado && emRotaAuth) {
      router.replace('/(app)');
    }
  }, [carregando, autenticado, segmentos, router]);

  if (carregando) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="perfil" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RaizNavegacao />
    </AuthProvider>
  );
}
