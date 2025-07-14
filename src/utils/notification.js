import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../components/firebase/firebase';
import { getUserInfo } from './auth';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

const getPlatform = () => 'web';

export const initializeNotifications = async () => {
  if (!messaging) {
    console.warn('Firebase messaging não está disponível no ambiente atual.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BKj8915CfWO4HwwROONrMOe08jJWebq0amAChXO32plY0oYI0WMERgtRBrmrfTFLO4WVA0hRA9mr8EQJeT0MIvk'
      });
      if (token) {
        console.log('Token de notificação:', token);
        await sendTokenToBackend(token);
      } else {
        console.warn('Token não obtido.');
      }
    } else {
      console.warn('Permissão de notificação negada.');
    }
  } catch (error) {
    console.error('Erro ao obter o token:', error);
  }
};

export const sendTokenToBackend = async (token) => {
  const userInfo = getUserInfo();
  if (!userInfo) {
    console.error('Usuário não autenticado. Faça login primeiro.');
    return;
  }

  const jwtToken = localStorage.getItem('token');
  const userId = userInfo.id;

  if (!jwtToken || !userId) {
    console.error('JWT ou userId inválidos.');
    return;
  }

  const deviceId = getDeviceId();
  const platform = getPlatform();

  try {
    const response = await fetch('http://localhost:5000/api/users/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        userId,
        token,
        platform,
        device_id: deviceId
      }),
    });
    const data = await response.json();
    console.log('Resposta do backend:', data);
  } catch (error) {
    console.error('Erro ao enviar token para backend:', error);
  }
};

if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('Mensagem recebida em primeiro plano:', payload);
    alert(`Nova mensagem: ${payload.notification?.title || 'Notificação'}`);
  });
} else {
  console.warn('Firebase messaging não disponível - onMessage não registrado.');
}