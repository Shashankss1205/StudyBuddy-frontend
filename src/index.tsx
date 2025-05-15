import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './theme/ThemeProvider';
import axios from 'axios';

// Set up axios with authentication token from localStorage
const token = localStorage.getItem('studybuddy_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('Auth token set from localStorage on startup');
}

// Add a response interceptor to handle 401 errors globally
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401 && localStorage.getItem('studybuddy_token')) {
      console.log('Session expired, logging out...');
      // Clear auth data
      localStorage.removeItem('studybuddy_token');
      localStorage.removeItem('studybuddy_user');
      delete axios.defaults.headers.common['Authorization'];
      
      // Reload page to redirect to login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
