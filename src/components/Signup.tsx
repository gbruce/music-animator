import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { authStyles as styles } from './styles/AuthStyles';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signup(email, username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}>
        <div className={styles.formContainer}>
          <h2 className={styles.heading}>Create Account</h2>
          <p className={styles.subHeading}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in
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
                <label htmlFor="email" className={styles.label}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your email"
                />
              </div>

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
                  placeholder="Choose a username"
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
                  placeholder="Create a password"
                />
              </div>

              <button type="submit" className={styles.button}>
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 