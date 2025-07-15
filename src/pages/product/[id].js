import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import Layout from '../../components/layout';
import styles from '../../styles/product.module.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ProductPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [priceHistoryBySource, setPriceHistoryBySource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchProductDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        const productResponse = await axios.get(
          `http://localhost:5000/api/products/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-device-id': deviceId,
            },
          }
        );

        const productData = productResponse.data.product;

        if (!productData || typeof productData !== 'object') {
          throw new Error('Produto não encontrado na resposta do backend');
        }

        const prices =
          productData.offers &&
          productData.offers[0] &&
          productData.offers[0].prices
            ? productData.offers[0].prices
            : [];

        const latestPrice =
          prices.length > 0
            ? prices.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                .value
            : null;

        const isValidImageUrl = (url) => {
          return (
            url &&
            typeof url === 'string' &&
            (url.startsWith('http') || url.startsWith('/'))
          );
        };

        const mappedProduct = {
          title: productData.name || 'N/A',
          image: isValidImageUrl(productData.imageUrl)
            ? productData.imageUrl
            : '/images/placeholder-phone.jpg',
          price: latestPrice
            ? `${latestPrice} ${productData.currency}`
            : 'N/A',
          link: productData.url || '#',
          brand: productData.brand || 'N/A',
          model: productData.model || 'N/A',
          color: productData.color || 'N/A',
          memory: productData.memory || 'N/A',
          source:
            productData.offers && productData.offers[0]
              ? productData.offers[0].source
              : 'N/A',
          lastUpdated:
            productData.offers && productData.offers[0]
              ? productData.offers[0].lastUpdated
              : 'N/A',
          currency: productData.currency || 'N/A',
          offers: productData.offers || [],
        };

        setProduct(mappedProduct);

        const groupedPriceHistory = [];

        productData.offers?.forEach((offer) => {
          if (offer.prices?.length > 0) {
            groupedPriceHistory.push({
              source: offer.source,
              data: offer.prices.map((price) => ({
                date: price.date,
                value: price.value,
              })),
            });
          }
        });

        setPriceHistoryBySource(groupedPriceHistory);

        const favoritesResponse = await axios.get(
          'http://localhost:5000/api/favorites/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const favoritesData = favoritesResponse.data.favorites || [];
        const existingFavorite = favoritesData.find(
          (fav) => fav.productId._id === id
        );

        if (existingFavorite) {
          setIsFavorite(true);
          setFavoriteId(existingFavorite._id);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
        } else if (err.response?.status === 404) {
          setError(
            'Produto não encontrado. Verifique se o ID está correto ou tente novamente mais tarde.'
          );
        } else {
          setError(
            'Erro ao carregar os detalhes do produto. Tente novamente.'
          );
          console.error('Erro na requisição:', err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, router]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token || !product || !id) return;

    if (!isFavorite && !selectedAlert) {
      setError('Por favor, selecione um tipo de alerta.');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(
          `http://localhost:5000/api/favorites/${favoriteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsFavorite(false);
        setFavoriteId(null);
        setSuccessMessage('Produto removido dos favoritos!');
      } else {
        const response = await axios.post(
          'http://localhost:5000/api/favorites/',
          {
            productId: id,
            offerId: null,
            alerts: [{ type: selectedAlert }],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsFavorite(true);
        setFavoriteId(response.data.favorite._id);
        setSelectedAlert('');
        setSuccessMessage('Produto adicionado aos favoritos!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar favoritos:', err.response?.data || err.message);
      setError(
        'Erro ao atualizar favoritos: ' +
          (err.response?.data?.msg || 'Tente novamente.')
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Carregando...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.error}>{error}</div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className={styles.error}>Produto não encontrado.</div>
      </Layout>
    );
  }

  const chartData = {
    datasets: priceHistoryBySource.map((sourceEntry, index) => ({
      label: sourceEntry.source,
      data: sourceEntry.data.map((entry) => ({
        x: new Date(entry.date),
        y: entry.value,
      })),
      borderColor: `hsl(${index * 70 % 360}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 70 % 360}, 70%, 50%, 0.2)`,
      fill: false,
      tension: 0.4,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Histórico de Preço por Loja' },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'dd/MM/yyyy',
          displayFormats: { day: 'dd/MM' },
        },
        title: { display: true, text: 'Data' },
      },
      y: {
        title: { display: true, text: `Preço (${product.currency})` },
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} ${product.currency}`,
        },
      },
    },
  };

  return (
    <Layout pageTitle={product.title}>
      <div className={styles.productContainer}>
        <div className={styles.productDetails}>
          <img
            src={product.image}
            alt={product.title}
            className={styles.productImage}
            onError={(e) => {
              e.target.src = '/images/placeholder-phone.jpg';
            }}
          />
          <div className={styles.productInfo}>
            <h1 className={styles.productTitle}>{product.title}</h1>
            <p className={styles.productPrice}>Preço Atual: {product.price}</p>
            <p><strong>Marca:</strong> {product.brand}</p>
            <p><strong>Modelo:</strong> {product.model}</p>
            <p><strong>Cor:</strong> {product.color}</p>
            <p><strong>Memória:</strong> {product.memory}</p>
            <p><strong>Fonte:</strong> {product.source}</p>
            <p><strong>Última Atualização:</strong> {product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : 'N/A'}</p>

            <div className={styles.favoriteSection}>
              {!isFavorite && (
                <div className={styles.alertSelection}>
                  <label htmlFor="alertType">Selecione um Alerta:</label>
                  <select
                    id="alertType"
                    value={selectedAlert}
                    onChange={(e) => setSelectedAlert(e.target.value)}
                    className={styles.alertDropdown}
                  >
                    <option value="">Escolha um alerta</option>
                    <option value="price_changed">Mudança de Preço</option>
                    <option value="price_dropped">Queda de Preço</option>
                    <option value="price_increased">Aumento de Preço</option>
                  </select>
                </div>
              )}
              <span
                className={`${styles.favoriteStar} ${isFavorite ? styles.active : ''}`}
                onClick={handleToggleFavorite}
                title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              >
                {isFavorite ? '★' : '☆'}
              </span>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && (
              <div className={styles.successMessage}>{successMessage}</div>
            )}
          </div>
        </div>

        <div className={styles.priceChart}>
          {priceHistoryBySource.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p>Sem histórico de preços disponível.</p>
          )}
        </div>

        {product.offers?.length > 0 && (
          <div className={styles.offersList}>
            <h2>Preços por Loja</h2>
            {product.offers.map((offer, index) => {
              const lastPrice =
                offer.prices?.length > 0
                  ? offer.prices.sort(
                      (a, b) => new Date(b.date) - new Date(a.date)
                    )[0].value
                  : 'N/A';
              return (
                <div key={index} className={styles.offerItem}>
                  <strong>{offer.source}:</strong>{' '}
                  {lastPrice !== 'N/A'
                    ? `${lastPrice} ${product.currency}`
                    : 'Sem preço'}{' '}
                  <a href={offer.url} target="_blank" rel="noopener noreferrer">
                    Ver na loja
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductPage;
