import { createContext, useState, useEffect, useContext } from "react";
import api from "../api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);


  const fetchUser = async (accessToken) => {
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      const { data } = await api.get("/auth/me");
      setUser(data);
      return true;
    } catch (err) {
      console.error("Failed to fetch user", err);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common["Authorization"];
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchUser(token);
      }
      setLoading(false);
    };
    initAuth();
  }, []); 

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const { data } = await api.post("/auth/login", formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    
    await fetchUser(data.access_token); 
  };

  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
    await login(email, password); 
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, token, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);