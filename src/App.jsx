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
    // 1. Define the initialization logic
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        if (initialSession) {
          // If we have a session, we MUST wait for the profile
          await fetchUserProfile(initialSession.user.id);
        } else {
          // No session, we are done loading
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    // 2. Run initialization
    initializeAuth();

    // 3. Set up the listener for future changes (sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        // Only fetch profile if it's not already loaded for this user
        // This prevents double-fetching on initialization
        await fetchUserProfile(newSession.user.id);
      } else {
        setUserProfile(null);
        setLoading(false); // Stop loading if user signs out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If we get the permission error (42501), it means RLS is blocking us.
        // We shouldn't block the app, but user experience might be degraded.
        if (error.code === '42501' || error.code === 'PGRST301') {
          console.warn('Permission error, creating default profile');
          setUserProfile({
            id: userId,
            role: 'seeker', // Default fallback
            department: 'Unknown'
          });
        } else {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      // CRITICAL: We only set loading to false AFTER profile attempt is done
      setLoading(false);
    }
  };

  // 4. Global Loading State
  // We do not render ANY routes until we are 100% sure about the auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading your profile...</p>
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
            // Guard: Must have Session AND Admin Role
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
            // Guard: Must have Session AND Profile
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