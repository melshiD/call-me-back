<template>
  <div class="min-h-screen bg-midnight text-cream flex items-center justify-center font-[--font-body]">
    <div class="text-center">
      <div class="w-16 h-16 border-4 border-glow/30 border-t-glow rounded-full animate-spin mx-auto mb-6"></div>
      <p class="text-cream/60 text-lg">Completing sign in...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const token = route.query.token;

  if (token) {
    // Store the token
    localStorage.setItem('adminToken', token);
    // Redirect to dashboard
    router.replace('/admin/dashboard');
  } else {
    // No token, redirect to login with error
    router.replace('/admin/login?error=no_token');
  }
});
</script>
