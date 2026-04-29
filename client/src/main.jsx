import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!googleClientId) {
  console.warn(
    '[Glide] VITE_GOOGLE_CLIENT_ID is not set. Google sign-in will be unavailable. ' +
    'Copy client/.env.example to client/.env and fill in the required values.'
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))

if (googleClientId) {
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  )
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
