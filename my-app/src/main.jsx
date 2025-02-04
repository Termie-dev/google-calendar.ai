import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const supabase = createClient(
  "https://lsqfawdpyomhsbxxcxdm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWZhd2RweW9taHNieHhjeGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2MzUzNDYsImV4cCI6MjA1NDIxMTM0Nn0.m2xj-fLNv_TruURzCt8oEfZZ55Av8ZcsdyLiTgT8-KM"
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionContextProvider supabaseClient={supabase}> 
      <App />
    </SessionContextProvider>
  </StrictMode>,
)
