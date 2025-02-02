import React from 'react';

const Login = () => {
  const API_BASE_URL = "http://127.0.0.1:8001"; // Change to deployed Auth service

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/login/google`;
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
