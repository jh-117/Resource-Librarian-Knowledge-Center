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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
        setAuthChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
        setAuthChecked(true);
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
        if (error.code === '42501' || error.code === 'PGRST301') {
          console.warn('Permission error, creating default profile');
          setUserProfile({
            id: userId,
            role: 'seeker',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          return;
        }
        throw error;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  if (loading && !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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