import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { authStyles as styles } from './styles/AuthStyles';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}>
        <div className={styles.formContainer}>
          <h2 className={styles.heading}>Welcome Back</h2>
          <p className={styles.subHeading}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorContainer}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <div className={styles.inputContainer}>
              <div>
                <label htmlFor="username" className={styles.label}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className={styles.link}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className={styles.button}>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 