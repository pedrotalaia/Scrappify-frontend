import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../components/layout';
import styles from '../styles/favorites.module.scss';

const FavoritesPage = () => {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/');
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.get(
          'http://localhost:5000/api/favorites/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('Resposta dos favoritos:', response.data);

        const favoritesData = response.data.favorites || [];
        setFavorites(favoritesData);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
        } else {
          setError('Erro ao carregar os favoritos. Tente novamente.');
          console.error('Erro na requisição:', err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  const handleRemoveFavorite = async (favoriteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/favorites/${favoriteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFavorites(prevFavorites => prevFavorites.filter(fav => fav._id !== favoriteId));
      alert('Produto removido dos favoritos!');
    } catch (err) {
      console.error('Erro ao remover favorito:', err.response?.data || err.message);
      alert('Erro ao remover favorito: ' + (err.response?.data?.msg || 'Tente novamente.'));
    }
  };

  if (loading) {
    return <Layout><div className={styles.loading}>Carregando...</div></Layout>;
  }

  if (error) {
    return <Layout><div className={styles.error}>{error}</div></Layout>;
  }

  if (favorites.length === 0) {
    return <Layout><div className={styles.noFavorites}>Nenhum produto nos favoritos.</div></Layout>;
  }

  return (
    <Layout pageTitle="Favoritos">
      <div className={styles.favoritesContainer}>
        <div className={styles.favoritesGrid}>
          {favorites.map((favorite) => {
            const product = favorite.productId || {};
            const prices = product.offers && product.offers[0] && product.offers[0].prices
              ? product.offers[0].prices
              : [];
            const latestPrice = prices.length > 0
              ? prices.sort((a, b) => new Date(b.date) - new Date(a.date))[0].value
              : null;
            const priceDisplay = latestPrice ? `${latestPrice} ${product.currency || ''}` : 'N/A';
            const imageUrl = product.imageUrl || '/images/placeholder-phone.jpg';
            console.log('Tentando carregar imagem para', product.name, ':', imageUrl);

            return (
              <Link
                key={favorite._id}
                href={`/product/${product._id}`}
                className={styles.productCardLink}
              >
                <div className={styles.productCard}>
                  <h3>{product.name || 'N/A'}</h3>
                  <div className={styles.productImage}>
                    <img
                      src={imageUrl}
                      alt={product.name || 'Produto'}
                      onError={(e) => {
                        console.log('Erro ao carregar imagem, usando fallback:', '/images/placeholder-phone.jpg');
                        e.target.src = '/images/placeholder-phone.jpg';
                      }}
                    />
                  </div>
                  <div className={styles.storagePriceRow}>
                    <div className={styles.price}>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default FavoritesPage;