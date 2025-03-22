import { useState } from 'react';
import styles from '../styles/login.module.scss';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
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

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              className={styles.input}
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Login
          </button>
          <button className={styles.googleButton}>Login with Google</button>
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