'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import { toast } from 'react-toastify';

const LoginScreen = ({ onLogin }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && !isLoading) {
      setIsLoading(true);
      toast.success(`Magic link sent to`, {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      // Show toast briefly, then navigate
      setTimeout(() => {
        setIsLoading(false);
        if (onLogin) {
          onLogin();
        } else {
          router.push('/library');
        }
      }, 1200);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div className="login-container">
      {/* Background Decorative Images */}
      <div className="login-background-images">
        <Image 
          src="/images/loginTop.png" 
          alt="Login Top Decoration" 
          width={270}
          height={200}
          className="login-top-image"
        />
        <Image 
          src="/images/loginBottom.png" 
          alt="Login Bottom Decoration" 
          width={270}
          height={200}
          className="login-bottom-image"
        />
      </div>

     
      {/* Login Form */}
      <div className="login-form-container">
          {/* Logo */}
          <div className="login-logo">
            <Image 
              src="/logo.svg" 
              alt="SyndetAI Logo" 
              width={120}
              height={40}
              className="logo-image"
            />
          </div>

          {/* Email Input */}
          <form onSubmit={handleSubmit} className="login-form-content">
            <CustomInputField
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              className="login-email-input"
              required
            />

            {/* Send Magic Link Button */}
            <CustomButton 
              type="submit" 
              className='login-button' 
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </CustomButton>
          </form>
        
      </div>

    </div>
  );
};

export default LoginScreen;
