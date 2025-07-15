import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          alert('Token de verificação não encontrado.');
          navigate('/account');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);

        if (response.status === 200) {
          const { email, newToken } = response.data;
          localStorage.setItem('token', newToken); 
          alert('Email verificado e atualizado com sucesso!');
          window.location.href = '/account';
        }
      } catch (error) {
        if (error.response) {
          console.log('Resposta de erro do backend:', error.response.data);
          alert(error.response.data.message || 'Erro ao verificar o email');
        } else {
          console.log('Erro de conexão ou outro problema:', error.message);
          alert('Erro de conexão com o servidor');
        }
        navigate('/account');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return <div>Verificando email...</div>;
};

export default VerifyEmail;