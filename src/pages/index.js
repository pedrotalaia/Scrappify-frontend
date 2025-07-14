import { useState } from 'react';
import styles from '../styles/login.module.scss';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailPlaceholder, setEmailPlaceholder] = useState('Email');
  const [passwordPlaceholder, setPasswordPlaceholder] = useState('Password');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError(false);
    setPasswordError(false);
    setEmailPlaceholder('Email');
    setPasswordPlaceholder('Password');

    let hasError = false;

    if (!email) {
      setEmailError(true);
      setEmailPlaceholder('Preencha este campo');
      hasError = true;
    }

    if (!password) {
      setPasswordError(true);
      setPasswordPlaceholder('Preencha este campo');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const { token } = response.data;

      localStorage.setItem('token', token);

      router.push('/homepage');

    } catch (error) {
      if (error.response && error.response.data.msg) {
        setError(error.response.data.msg);
      } else {
        setError('Erro ao conectar ao servidor!');
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} className={styles.form} noValidate>
        <div className={styles.inputGroup}>
            <input
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              type="email" 
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false);
                setEmailPlaceholder('Email');
              }}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
              type="password"
              placeholder={passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
                setPasswordPlaceholder('Password');
              }}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Login
          </button>
          <button 
            type="button" 
            className={styles.googleButton} 
            onClick={handleGoogleLogin}
          >
            Login with Google
          </button>
        </form>

        <p className={styles.registerPrompt}>
          Don't have an account?
          <Link href="/register" className={styles.registerLink}>
            {' '}Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}