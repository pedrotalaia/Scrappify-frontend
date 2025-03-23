import { useState } from 'react';
import Link from "next/link";
import styles from "../styles/register.module.scss";
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name,
        email,
        password,
      });

      setSuccess(response.data.msg || 'Usuário registrado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.msg || 'Erro ao registrar usuário!');
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Create Account</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Sign Up
          </button>
          <button type="button" className={styles.googleButton} onClick={handleGoogleRegister}>
            Sign Up with Google
          </button>
        </form>
        <p className={styles.loginPrompt}>
          Already have an account?
          <Link href="/" className={styles.loginLink}>
            {' '}Login
          </Link>
        </p>
      </div>
    </div>
  );
}