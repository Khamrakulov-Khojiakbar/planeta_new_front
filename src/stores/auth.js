import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(null);

  if (token.value) {
    try {
      user.value = jwtDecode(token.value);
    } catch {
      token.value = null;
      localStorage.removeItem('token');
    }
  }

  const isAuthenticated = computed(() => !!token.value);

  const hasRole = (roleName) => {
    if (!user.value) return false;
    const roles =
      user.value['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      user.value.role;

    if (Array.isArray(roles)) {
      return roles.includes(roleName);
    }
    return roles === roleName;
  };

  const isAdmin = computed(() => hasRole('Admin'));
  const isManager = computed(() => hasRole('Manager'));

  async function login(email, password) {
    const response = await api.post('/api/auth/login', { email, password });

    // AuthResponse: { token, username, role }
    const jwt = response.data.token || response.data.Token;

    token.value = jwt;
    localStorage.setItem('token', jwt);
    user.value = jwtDecode(jwt);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  return { token, user, isAuthenticated, isAdmin, isManager, login, logout };
});