function decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }
  
  function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return decoded; 
  }
  
  function isPremium() {
    const userInfo = getUserInfo();
    return userInfo && userInfo.plan === 'premium';
  }
  
  function setToken(token) {
    localStorage.setItem('token', token);
  }
  
  function logout() {
    localStorage.removeItem('token');
  }
  
  export { getUserInfo, isPremium, setToken, logout };