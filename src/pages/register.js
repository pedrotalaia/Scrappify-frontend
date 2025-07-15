import { useState } from 'react';
import Link from "next/link";
import styles from "../styles/register.module.scss";
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nameError, setNameError] = useState(false); 
  const [emailError, setEmailError] = useState(false); 
  const [passwordError, setPasswordError] = useState(false);
  const [birthDateError, setBirthDateError] = useState(false);
  const [sexError, setSexError] = useState(false);
  const [namePlaceholder, setNamePlaceholder] = useState('Name');
  const [emailPlaceholder, setEmailPlaceholder] = useState('Email');
  const [passwordPlaceholder, setPasswordPlaceholder] = useState('Password');
  const [birthDatePlaceholder, setBirthDatePlaceholder] = useState('Birth Date (YYYY-MM-DD)');
  const [sexPlaceholder, setSexPlaceholder] = useState('Sex (M/F/O)');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNameError(false);
    setEmailError(false);
    setPasswordError(false);
    setBirthDateError(false); 
    setSexError(false); 
    setNamePlaceholder('Name');
    setEmailPlaceholder('Email');
    setPasswordPlaceholder('Password');

    let hasError = false;

    if (!name) {
      setNameError(true);
      setNamePlaceholder('Preencha este campo');
      hasError = true;
    }

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

    if (name.length > 50) {
      setError('O nome não pode ter mais de 50 caracteres.');
      setNameError(true);
      return;
    }

    if (email.length > 100) {
      setError('O email não pode ter mais de 100 caracteres.');
      setNameError(true);
      return;
    }

    if (password.length <= 6) {
      setError('A palavra-passe deve ter mais de 6 caracteres.');
      setPasswordError(true);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name,
        email,
        password,
        birthDate, 
        sex,  
      });

      setSuccess(response.data.msg || 'Usuário registado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.msg || 'Erro ao registar usuário!');
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
        <form onSubmit={handleRegister} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder={namePlaceholder}
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(false);
                setNamePlaceholder('Name');
              }}
              maxLength={50}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder={emailPlaceholder}
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false);
                setEmailPlaceholder('Email');
              }}
              maxLength={100}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder={passwordPlaceholder}
              className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
                setPasswordPlaceholder('Password');
              }}
              minLength={7}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="date"
              placeholder={birthDatePlaceholder}
              className={`${styles.input} ${birthDateError ? styles.inputError : ''}`}
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setBirthDateError(false);
                setBirthDatePlaceholder('Birth Date (YYYY-MM-DD)');
              }}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder={sexPlaceholder}
              className={`${styles.input} ${sexError ? styles.inputError : ''}`}
              value={sex}
              onChange={(e) => {
                setSex(e.target.value);
                setSexError(false);
                setSexPlaceholder('Sex (M/F/O)');
              }}
              maxLength={1}
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