<template>
  <div class="min-h-screen bg-midnight text-cream flex items-center justify-center font-[--font-body]">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none blur-[150px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
    </div>

    <div class="text-center">
      <div class="w-16 h-16 border-4 border-glow/30 border-t-glow rounded-full animate-spin mx-auto mb-6"></div>
      <p class="text-cream/60 text-lg">Completing sign in...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const token = route.query.token;

  if (token) {
    // Store the token using the auth store
    // This will also fetch the user profile
    try {
      await authStore.setTokenFromOAuth(token);
      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err) {
      console.error('OAuth callback error:', err);
      router.replace('/login?error=auth_failed');
    }
  } else {
    // No token, redirect to login with error
    router.replace('/login?error=no_token');
  }
});
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
