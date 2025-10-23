'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';

const LoginScreen = ({ onLogin }) => {
  const router = useRouter();
  const { refreshUserData } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle URL parameters for expired tokens and successful authentication
  useEffect(() => {
    if (!mounted) return;

    const url = new URL(window.location.href);
    const hash = url.hash;
    
    // Check for expired token error
    const hasExpiredToken = hash.includes('error_code=otp_expired') || 
                           hash.includes('error_code=expired_token');
    
    if (hasExpiredToken) {
      setShowResend(true);
      toast.error('Your login link has expired. You can request a new one below.', {
        autoClose: 5000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    // Check for successful authentication token
    const hasAccessToken = hash.includes('access_token=');
    if (hasAccessToken) {
      // Extract token from hash
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set session and redirect to library
        const handleAuth = async () => {
          const { getSupabase } = await import('../supabaseClient');
          const supabase = getSupabase();
          
          // Set the session in Supabase auth
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          // Get the actual session from Supabase
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          
          toast.success('Login successful! Redirecting...');
          setTimeout(() => {
            router.push('/library');
          }, 1000);
        };
        
        handleAuth();
      }
    }
  }, [mounted, router]);

  // On first authenticated session, register user in app_users from pending_invites
  useEffect(() => {
    const handleFirstLogin = async () => {
      try {
        const { getSupabase } = await import('../supabaseClient');
        const supabase = getSupabase();
  
        // Wait for user to be available (retry up to 5 times)
        let user = null;
        for (let i = 0; i < 5; i++) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            user = authData.user;
            break;
          }
          await new Promise((res) => setTimeout(res, 500)); // wait 0.5s
        }
  
        if (!user) {
          console.warn('User not found after login, skipping setup.');
          return;
        }
  
        // Check if user already exists in app_users
        const { data: existingUser, error: existingErr } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
  
        if (existingErr) {
          console.error('Error checking app_users:', existingErr.message || existingErr);
          return;
        }
        if (existingUser) return;
  
        // Find pending invite by email
        console.log('🔍 Checking pending invites for:', user.email);
        const { data: invite, error: inviteErr } = await supabase
          .from('pending_invites')
          .select('organisation_id, username')
          .eq('email', user.email)
          .maybeSingle();

        if (inviteErr) {
        
          return;
        }
        if (!invite) {
          
          return;
        }
        
        console.log(' Found pending invite:', invite);
  
        const username = invite.username || (user.email ? user.email.split('@')[0] : 'user');

        console.log(' Inserting user into app_users:', {
          id: user.id,
          email: user.email,
          username,
          organisation_id: invite.organisation_id
        });

        // Insert user into app_users
        const { error: insertErr } = await supabase.from('app_users').insert([
          {
            id: user.id,
            email: user.email,
            username,
            is_admin: false,
            is_superadmin: false,
            organisation_id: invite.organisation_id,
            is_active: true,
          },
        ]);

        if (insertErr) {
        
          return;
        }
        
        console.log(' Successfully inserted user into app_users');

        // Delete pending invite
        const { error: deleteErr } = await supabase.from('pending_invites').delete().eq('email', user.email);
        
        if (deleteErr) {
         
        } else {
          console.log(' Successfully deleted pending invite');
        }

        // Refresh user data in AppContext to show credits and other data
        console.log(' Refreshing user data...');
        try {
          // Call the refresh function from AppContext
          if (refreshUserData) {
            await refreshUserData();
            console.log(' User data refreshed successfully');
          }
        } catch (refreshError) {
        
        }
      } catch (e) {
        console.error('First login setup failed:', e);
      }
    };
  
    if (session) {
      console.log('🚀 Session found, starting first login process');
      handleFirstLogin();
    }
  }, [session]);
  

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      if (!mounted) return;
      
      try {
        const { getSupabase } = await import('../supabaseClient');
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setSession(data.session);
          // If user is already authenticated, redirect to library
          router.push('/library');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Error checking authentication status. Please try again.', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [mounted, router]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!mounted || checkingSession) return;
  
    if (!email.trim()) {
      toast.error('Please enter your email address.', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
      });
      return;
    }
  
    if (email && !isLoading) {
      setIsLoading(true);
  
      try {
        const { getSupabase } = await import('../supabaseClient');
        const supabase = getSupabase();
  
        // 🔍 Step 1: Check if email exists in app_users table
        const { data, error: userError } = await supabase
          .from('app_users')
          .select('email')
          .eq('email', email);
  
        if (userError) {
          console.error('User lookup error:', userError);
          toast.error('Error checking user. Please try again.');
          return;
        }
  
        // 🔒 Step 2: If user not found
        if (!data || data.length === 0) {
          toast.error('No user found with this email address.', {
            autoClose: 4000,
            pauseOnHover: false,
            pauseOnFocusLoss: false,
          });
          return;
        }
  
        // ✅ Step 3: Email exists, send magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false, // since user already exists
          },
        });
  
        if (error) {
          console.error('Login error:', error);
          toast.error('Login failed. Please try again.');
        } else {
          toast.success('Magic link sent! Please check your email.', {
            autoClose: 4000,
            pauseOnHover: false,
            pauseOnFocusLoss: false,
          });
          setEmail('');
          setShowResend(false);
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

          {/* Always render the form structure to prevent hydration mismatch */}
          <form onSubmit={handleSubmit} className="login-form-content">
            <CustomInputField
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              className="login-email-input"
              disabled={!mounted || checkingSession}
              required
            />

            {/* Login Button */}
            <CustomButton 
              type="submit" 
              className='login-button' 
              disabled={isLoading || !mounted || checkingSession}
            >
              {(!mounted || checkingSession) ? 'Loading...' : (isLoading ? 'Sending...' : 'Login')}
            </CustomButton>
          </form>
        
      </div>

    </div>
  );
};

export default LoginScreen;
