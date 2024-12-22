import React from "react";
import axios from "axios";

const GoogleLogin = ({ setIsAuthenticated }) => {
  const handleGoogleLogin = async () => {
    try {
      const redirectUri = 'http://127.0.0.1:3000/api/auth/callback'; // React app callback
      const response = await axios.get(`http://127.0.0.1:8000/api/auth/login`, {
        params: { redirect_uri: redirectUri },
      });

      // Redirect user to Google authentication URL
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
    }
  };

  return (
    <div>
      <h1>Login with Google</h1>
      <button onClick={handleGoogleLogin}>Login</button>
    </div>
  );
};

export default GoogleLogin;
