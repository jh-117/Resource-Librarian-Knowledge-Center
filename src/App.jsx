import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Import pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SeekerLogin from './pages/SeekerLogin';
import SeekerDashboard from './pages/SeekerDashboard';
import UploaderFlow from './pages/UploaderFlow';
import ResourceDetail from './pages/ResourceDetail';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted, starting auth check...');

    // 1. Safety Valve: Force stop loading after 5 seconds if DB hangs
    const safetyTimer = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('⚠️ Auth check timed out. Forcing app to load.');
          return false;
        }
        return currentLoading;
      });
    }, 5000);

    // 2. Define the initialization logic
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        if (initialSession) {
          console.log('Session found, fetching profile...');
          await fetchUserProfile(initialSession.user.id);
        } else {
          console.log('No session found.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    // 3. Run initialization
    initializeAuth();

    // 4. Set up the listener for future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);

      if (newSession) {
        await fetchUserProfile(newSession.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      // Create a timeout promise to prevent hanging requests
      const dbTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database request timed out')), 4000)
      );

      // Race the DB query against the timeout
      const dbQuery = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([dbQuery, dbTimeout])
        .catch(err => ({ data: null, error: err })); // Catch timeout error

      if (error) {
        // Handle specific error codes
        if (error.code === '42501' || error.code === 'PGRST301') {
          console.warn('RLS Permission error (42501), using fallback profile');
          setUserProfile({
            id: userId,
            role: 'seeker',
            department: 'Unknown'
          });
        } else if (error.code === 'PGRST116') {
          console.warn('No profile found (PGRST116), using fallback');
          setUserProfile({
            id: userId,
            role: 'seeker',
            department: 'Unknown'
          });
        } else {
          console.error('Error fetching user profile:', error);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      // CRITICAL: Always stop loading
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading your profile...</p>
          <p className="text-xs text-gray-400">This should take less than 5 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploaderFlow />} />
        
        <Route 
          path="/admin/login" 
          element={
            session && userProfile?.role === 'admin' 
              ? <Navigate to="/admin/dashboard" replace /> 
              : <AdminLogin />
          } 
        />
        <Route 
          path="/seeker/login" 
          element={
            session && userProfile 
              ? <Navigate to="/seeker/dashboard" replace />
              : <SeekerLogin />
          } 
        />
        
        <Route
          path="/admin/dashboard"
          element={
            session && userProfile?.role === 'admin' ? (
              <AdminDashboard user={session.user} profile={userProfile} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        
        <Route
          path="/seeker/dashboard"
          element={
            session && userProfile ? (
              <SeekerDashboard user={session.user} profile={userProfile} />
            ) : (
              <Navigate to="/seeker/login" replace />
            )
          }
        />
        
        <Route
          path="/resource/:id"
          element={
            session && userProfile ? (
              <ResourceDetail user={session.user} profile={userProfile} />
            ) : (
              <Navigate to="/seeker/login" replace />
            )
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;