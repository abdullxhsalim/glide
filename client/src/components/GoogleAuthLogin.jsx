import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleAuthLogin = ({ text = "Sign In with Google" }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      setError(null);
      // We only receive an access token with useGoogleLogin, so let's fetch the user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      
      const userInfo = await userInfoResponse.json();
      
      // we need id token to send to backend, but standard react-oauth implicit flow doesnt give it directly.
      // So instead, we could use GoogleLogin component which gives credential. 
      // Let's modify approach and use code flow or standard GoogleLogin.
    } catch(err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // To keep it simple, we'll recommend using <GoogleLogin /> component directly in Login.jsx.
}
