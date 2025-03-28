import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TrackProvider } from './contexts/TrackContext';
import { ImageProvider } from './contexts/ImageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ComfyUIProvider } from './contexts/ComfyUIContext';
import { Txt2ImgProvider } from './contexts/Txt2ImgContext';
import { Img2ImgProvider } from './contexts/Img2ImgContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Profile } from './components/Profile';
import { ForgotPassword } from './components/ForgotPassword';
import Dashboard from './components/Dashboard';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return !user ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <TrackProvider>
            <ImageProvider>
              <ComfyUIProvider>
                <Txt2ImgProvider>
                  <Img2ImgProvider>
                    <Router>
                      <Routes>
                        <Route
                          path="/"
                          element={
                            <PrivateRoute>
                              <Dashboard activeTab="projects" />
                            </PrivateRoute>
                          }
                        />
                        <Route
                          path="/images"
                          element={
                            <PrivateRoute>
                              <Dashboard activeTab="images" />
                            </PrivateRoute>
                          }
                        />
                        <Route
                          path="/txt2img"
                          element={
                            <PrivateRoute>
                              <Dashboard activeTab="txt2img" />
                            </PrivateRoute>
                          }
                        />
                        <Route
                          path="/img2img"
                          element={
                            <PrivateRoute>
                              <Dashboard activeTab="img2img" />
                            </PrivateRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <PrivateRoute>
                              <Profile />
                            </PrivateRoute>
                          }
                        />
                        <Route
                          path="/login"
                          element={
                            <PublicRoute>
                              <Login />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/signup"
                          element={
                            <PublicRoute>
                              <Signup />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/forgot-password"
                          element={
                            <PublicRoute>
                              <ForgotPassword />
                            </PublicRoute>
                          }
                        />
                      </Routes>
                    </Router>
                  </Img2ImgProvider>
                </Txt2ImgProvider>
              </ComfyUIProvider>
            </ImageProvider>
          </TrackProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 