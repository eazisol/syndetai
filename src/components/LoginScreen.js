'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import { toast } from 'react-toastify';

const LoginScreen = ({ onLogin }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && !isLoading) {
      setIsLoading(true);
      
      try {
        // Dynamically import Supabase only on client side
        const { getSupabase } = await import('../supabaseClient');
        const supabase = getSupabase();
        
        // Call Supabase auth function
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: true,
          }
        });

        if (error) {
          console.error('Login error:', error);
          toast.error('Login failed. Please try again.');
        } else {
          toast.success('Magic link sent! Please check your email.');
          setEmail('');
          // Redirect to library page
          // router.push('/library');
        }
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  if (!mounted) {
    return null;
  }

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

            {/* Login Button */}
            <CustomButton 
              type="submit" 
              className='login-button' 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </CustomButton>
          </form>
        
      </div>

    </div>
  );
};

export default LoginScreen;
