import api from "./api";

export const authService = {
  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      const userData = res && res.data ? res.data : res;

      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      return userData;
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout:", err.message);
    } finally {
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn: () => {
    return !!localStorage.getItem("user");
  },

  getToken: () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.token || null;
  },
};
