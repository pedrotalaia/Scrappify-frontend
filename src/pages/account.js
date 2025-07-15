import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Layout from '../components/layout';
import styles from '../styles/account.module.scss';
import { FaPencilAlt, FaSignOutAlt, FaBell } from 'react-icons/fa';

const Account = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false); 
  const [notifications, setNotifications] = useState([]);

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
          setUserName(decodedToken.name);
          setUserEmail(decodedToken.email);
          setUserPlan(decodedToken.plan);
          setProfileImage(decodedToken.profilePicture || null);
          setLoading(false);
          console.log('Email definido no estado:', decodedToken.email);
          console.log('Imagem de perfil inicial (token):', decodedToken.profilePicture);
          console.log('Plano do usuário:', decodedToken.plan);

          const fetchNotifications = async () => {
            try {
              const response = await axios.get('http://localhost:5000/api/favorites/notifications', {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log('Resposta completa:', response); // Para depuração
              console.log('Notificações:', response.data.notifications); // Verifica o array específico
              setNotifications(response.data.notifications || []); // Extrai apenas o array notifications
            } catch (error) {
              console.error('Erro ao carregar notificações:', error);
              setNotifications([]);
            }
          };
          fetchNotifications();
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

  if (loading) {
    return <p>Carregando...</p>;
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Por favor, selecione uma imagem no formato JPEG ou PNG.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      console.log('Enviando requisição para o backend...');
      console.log('Token:', token);

      const response = await axios.post(
        'http://localhost:5000/api/users/changeProfilePicture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(' resil: ', response.data);
      console.log('Nova URL da imagem:', response.data.user.profilePicture);

      const newProfileImage = response.data.user.profilePicture;
      setProfileImage(newProfileImage);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const decodedToken = jwtDecode(response.data.token);
        setUserName(decodedToken.name);
        setUserEmail(decodedToken.email);
        setUserPlan(decodedToken.plan);
        setProfileImage(decodedToken.profilePicture || null);
        console.log('Novo token decodificado:', decodedToken);
      }

      setSuccessMessage('Imagem de perfil atualizada com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);
      if (error.response) {
        console.log('Resposta de erro do backend:', error.response.data);
        setErrorMessage(error.response.data.error || 'Erro ao atualizar a imagem de perfil');
      } else {
        setErrorMessage('Erro de conexão com o servidor');
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('A nova palavra-passe e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      const response = await axios.put(
        'http://localhost:5000/api/users/changepassword',
        {
          currentPassword,
          password: newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Senha alterada com sucesso! Você será redirecionado para o login em 2 segundos.');
      setErrorMessage('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordModal(false);

      localStorage.removeItem('token');

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Erro ao alterar a senha');
      } else {
        setErrorMessage('Erro de conexão com o servidor');
      }
    }
  };

  const handlePlanUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPlan || !cardNumber || !cardHolder || !cardExpiry || !cardCVV) {
      setErrorMessage('Por favor, preencha todos os campos do formulário.');
      return;
    }

    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber.replace(/\s/g, ''))) {
      setErrorMessage('O número do cartão deve conter 16 dígitos.');
      return;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(cardExpiry)) {
      setErrorMessage('A data de validade deve estar no formato MM/AA.');
      return;
    }

    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(cardCVV)) {
      setErrorMessage('O CVV deve conter 3 ou 4 dígitos.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/plan',
        {
          plan: newPlan,
          cardDetails: {
            cardNumber,
            cardHolder,
            cardExpiry,
            cardCVV,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(response.data.message);
      setUserPlan(newPlan);
      setNewPlan('');
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCVV('');
      setShowPlanModal(false);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Erro ao atualizar o plano');
      } else {
        setErrorMessage('Erro de conexão com o servidor');
      }
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !confirmNewEmail) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (!emailRegex.test(newEmail)) {
      setErrorMessage('Por favor, insira um email válido.');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      setErrorMessage('Os emails não coincidem. Por favor, confirme corretamente.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/auth/send-verification-email',
        { email: newEmail },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(
        `Um email de verificação foi enviado para ${newEmail}. Por favor, clique no link recebido para confirmar o novo email.`
      );
      setErrorMessage('');
      setNewEmail('');
      setConfirmNewEmail('');
      setShowEmailModal(false);
    } catch (error) {
      if (error.response) {
        console.log('Resposta de erro do backend:', error.response.data),
        setErrorMessage(error.response.data.message || 'Erro ao enviar email de verificação');
      } else {
        setErrorMessage('Erro de conexão com o servidor');
      }
    }
  };

  const handleGetStarted = async () => {
    setShowEditProfile(true);
    setNewPlan('free');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/plan',
        { plan: 'free' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage(response.data.message);
      setUserPlan('free');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Erro ao atualizar o plano');
      } else {
        setErrorMessage('Erro de conexão com o servidor');
      }
    }
  };

  const handleUpgradeToPro = () => {
    setShowEditProfile(true);
    setNewPlan('pro');
    setShowPlanModal(true);
  };

  const handleTalkToSales = () => {
    window.location.href = 'mailto:sales@scrappy.com';
  };

  const handleNotificationClick = (productId) => {
    window.location.href = `/product/${productId}`; 
    setShowNotifications(false); 
  };

  console.log('FaPencilAlt:', FaPencilAlt, 'FaSignOutAlt:', FaSignOutAlt);

  const headerActions = (
    <div className={styles.headerActions}>
      <button
        onClick={() => setShowEditProfile(!showEditProfile)}
        className={styles.headerEditButton}
        title="Editar Perfil"
      >
        <FaPencilAlt />
      </button>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }}
        className={styles.headerLogoutButton}
        title="Logout"
      >
        <FaSignOutAlt />
      </button>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className={styles.headerNotificationButton}
        title="Notificações"
      >
        <FaBell />
        {notifications.length > 0 && (
          <span className={styles.notificationBadge}>{notifications.length}</span>
        )}
      </button>
    </div>
  );

  return (
    <Layout pageTitle="Minha Conta" headerActions={headerActions}>
      <div className={styles.accountPage}>
        <div className={styles.profileImageContainer}>
          {showEditProfile ? (
            <label
              htmlFor="profileImageUpload"
              className={styles.clickableImageContainer}
              title="Clique para alterar a imagem"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Imagem de Perfil"
                  className={styles.profileImage}
                  onError={(e) => {
                    console.error('Erro ao carregar a imagem:', profileImage);
                    e.target.src = '';
                  }}
                />
              ) : (
                <div className={styles.profileImagePlaceholder}>Sem Imagem</div>
              )}
              <input
                type="file"
                id="profileImageUpload"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          ) : profileImage ? (
            <img
              src={profileImage}
              alt="Imagem de Perfil"
              className={styles.profileImage}
              onError={(e) => {
                console.error('Erro ao carregar a imagem:', profileImage);
                e.target.src = '';
              }}
            />
          ) : (
            <div className={styles.profileImagePlaceholder}>Sem Imagem</div>
          )}
        </div>

        <div className={styles.accountDetails}>
          <p>
            <strong>Nome:</strong> {userName}
          </p>
          <p>
            <strong>Email:</strong> {userEmail}{' '}
            {showEditProfile && (
              <span
                className={styles.editIcon}
                onClick={() => setShowEmailModal(true)}
                title="Editar Email"
              >
                ✎
              </span>
            )}
          </p>
          <p>
            <strong>Senha:</strong> ********{' '}
            {showEditProfile && (
              <span
                className={styles.editIcon}
                onClick={() => setShowPasswordModal(true)}
                title="Mudar Palavra-Passe"
              >
                ✎
              </span>
            )}
          </p>
          <p>
            <strong>Plano:</strong> {userPlan || 'Não definido'}
          </p>
        </div>
        
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

        {showEmailModal && (
          <div className={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Alterar Email</h2>
              <form onSubmit={handleEmailChange} className={styles.emailForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="newEmail">Novo Email</label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Digite o novo email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmNewEmail">Confirmar Novo Email</label>
                  <input
                    type="email"
                    id="confirmNewEmail"
                    value={confirmNewEmail}
                    onChange={(e) => setConfirmNewEmail(e.target.value)}
                    placeholder="Repita o novo email"
                  />
                </div>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
                <div className={styles.modalButtons}>
                  <button type="submit" className={styles.submitButton}>
                    Enviar Verificação
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowEmailModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Mudar Palavra-Passe</h2>
              <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Palavra-Passe Atual</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite a palavra-passe atual"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">Nova Palavra-Passe</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova palavra-passe"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmNewPassword">Confirmar Nova Palavra-Passe</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova palavra-passe"
                  />
                </div>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
                <div className={styles.modalButtons}>
                  <button type="submit" className={styles.submitButton}>
                    Alterar Palavra-Passe
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPlanModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Atualizar para Plano Pro</h2>
              <form onSubmit={handlePlanUpdate} className={styles.planForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="cardNumber">Número do Cartão</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cardHolder">Nome no Cartão</label>
                  <input
                    type="text"
                    id="cardHolder"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Nome do Titular"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cardExpiry">Data de Validade (MM/AA)</label>
                  <input
                    type="text"
                    id="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/AA"
                    maxLength="5"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cardCVV">CVV</label>
                  <input
                    type="text"
                    id="cardCVV"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value)}
                    placeholder="123"
                    maxLength="4"
                  />
                </div>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
                <div className={styles.modalButtons}>
                  <button type="submit" className={styles.submitButton}>
                    Atualizar Plano
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowPlanModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showNotifications && (
          <div className={styles.modalOverlay} onClick={() => setShowNotifications(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Notificações</h2>
              {notifications.length > 0 ? (
                <ul className={styles.notificationList}>
                  {notifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={styles.notificationItem}
                      onClick={() => handleNotificationClick(notification.productId)}
                    >
                      {notification.message} - {new Date(notification.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma notificação disponível.</p>
              )}
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowNotifications(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className={styles.pricingPlans}>
          <h2>Scrappy Pricing Plans</h2>
          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3>Free</h3>
              <p className="price">€0</p>
              <ul>
                <li>1 data source</li>
                <li>10 searches / month</li>
                <li>Up to 10 products per search</li>
                <li>Median price (P50) analysis</li>
                <li>Snapshot only (no history)</li>
                <li>No export</li>
              </ul>
              {userPlan === 'freemium' ? (
                <button className={styles.activePlanButton} disabled>
                  Actual Plan
                </button>
              ) : (
                <button onClick={handleGetStarted}>Get Started</button>
              )}
            </div>

            <div className={styles.pricingCard}>
              <h3>Pro</h3>
              <p className="price">€49</p>
              <ul>
                <li>All sources included</li>
                <li>500 searches / month</li>
                <li>Unlimited product results</li>
                <li>Full price analysis (AVG, P25, P50, P75)</li>
                <li>30-day price history & trends</li>
                <li>CSV, JSON, Excel export</li>
                <li>API access + scheduling</li>
              </ul>
              {userPlan === 'premium' ? (
                <button className={styles.activePlanButton} disabled>
                  Actual Plan
                </button>
              ) : (
                <button onClick={handleUpgradeToPro}>Upgrade to Pro</button>
              )}
            </div>

            <div className={styles.pricingCard}>
              <h3>Agency</h3>
              <p className="price">€99</p>
              <ul>
                <li>Unlimited usage</li>
                <li>Team accounts with permissions</li>
                <li>ALL Pro features included</li>
                <li>Custom alerts & notifications</li>
                <li>Power BI / Looker integration</li>
                <li>Priority support</li>
              </ul>
              {userPlan === 'agency' ? (
                <button className={styles.activePlanButton} disabled>
                  Actual Plan
                </button>
              ) : (
                <button onClick={handleTalkToSales}>Talk to Sales</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;