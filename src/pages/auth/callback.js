import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { initializeNotifications } from '../../utils/notification';

export default function Callback() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      initializeNotifications().then(() => {
        router.push('/homepage');
      });
    }
  }, [token, router]);

  return <div>Processando login com Google...</div>;
}