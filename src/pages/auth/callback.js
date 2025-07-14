import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;
    if (token) {
      localStorage.setItem('token', token);
      router.push('/homepage');
    }
  }, [router.query]);

  return (
    <div>
      <h1>Autenticando...</h1>
    </div>
  );
}