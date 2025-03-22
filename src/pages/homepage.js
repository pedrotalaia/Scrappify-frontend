import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; 

const Dashboard = () => {
  const [userPlan, setUserPlan] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
            localStorage.removeItem('token');
            window.location.href = '/';
          } else {
            setUserPlan(decodedToken.plan);
            setUserName(decodedToken.name);
          }
      } catch (error) {
        console.error('Erro ao decodificar o token:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div>
      <h1>Bem-vindo ao Scrappify, {userName}!</h1>
      {userPlan === 'freemium' ? (
        <div>
          <p>Plano Gratuito</p>
          <p>Acesse o scraping de 1 fonte (ex.: Google Shopping).</p>
          <button>Atualize para Premium</button>
        </div>
      ) : userPlan === 'premium' ? (
        <div>
          <p>Plano Premium</p>
          <p>Acesse todas as fontes, alertas de preços e análises avançadas!</p>
          <button>Gerenciar Fontes</button>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
};

export default Dashboard;