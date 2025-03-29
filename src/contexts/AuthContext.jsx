// src/contexts/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Create a mock user object with the properties your app needs
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create auth functions that return the expected data structure
  function login(email, password) {
    console.log('Login attempted with:', email);
    setLoading(true);
    
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a mock user object with proper structure
        const userData = {
          user: {
            uid: 'mock-user-id',
            email: email,
            user_type: 'startup_admin', // Change this to 'contributor' if needed
            displayName: email.split('@')[0]
          }
        };
        
        // Set the current user
        setCurrentUser(userData.user);
        setLoading(false);
        resolve(userData);
      }, 500);
    });
  }

  function logout() {
    console.log('Logout called');
    setCurrentUser(null);
    return Promise.resolve();
  }

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}