import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Layout from '../components/layout.js';
import styles from '../styles/Layout.module.scss';
import axios from 'axios';
import { FaMemory } from 'react-icons/fa';
import Link from 'next/link';

const Homepage = () => {
  const [userPlan, setUserPlan] = useState(null);
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [scrapeError, setScrapeError] = useState('');
  const categories = [
    { name: 'Tech & Electrónica', image: '/images/gaming_accessories.jpg' },
    { name: 'Fashion', image: '/images/gaming_accessories.jpg' },
    { name: 'Home', image: '/images/gaming_accessories.jpg' },
  ];

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
          console.log('Plano do usuário:', decodedToken.plan);
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

  const handleSearch = async () => {
    if (searchTerm.trim() === '' && !selectedCategory) {
      setSearchResult('Por favor, insira um produto para a procura ou selecione uma categoria.');
      return;
    }

    setScrapeError('');
    setProducts([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setScrapeError('Token de autenticação não encontrado. Faça login novamente.');
        window.location.href = '/';
        return;
      }

      let endpoint = 'http://localhost:5000/api/products/search';
      const requestBody = {
        query: searchTerm.trim() || undefined,
      };

      const stores = userPlan === 'freemium' ? ['Worten'] : ['Amazon', 'Worten'];

      if (selectedCategory) {
        endpoint = selectedCategory === 'No Category'
          ? 'http://localhost:5000/api/products/last-no-category'
          : `http://localhost:5000/api/products/category/${encodeURIComponent(selectedCategory)}`;
        delete requestBody.query;
        requestBody.stores = stores; 
      } else {
        requestBody.stores = stores;
      }

      console.log('Enviando requisição para:', endpoint, 'com body:', requestBody);

      const response = selectedCategory
        ? await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: requestBody,
          })
        : await axios.post(endpoint, requestBody, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

      const productsData = response.data;
      console.log('Resposta do backend:', productsData);

      let productsArray = [];
      if (Array.isArray(productsData)) {
        productsArray = productsData;
      } else if (productsData.products && Array.isArray(productsData.products)) {
        productsArray = productsData.products;
      } else if (productsData && typeof productsData === 'object') {
        productsArray = [productsData];
      } else {
        setScrapeError('Formato de dados inválido retornado pelo backend.');
        return;
      }

      if (productsArray.length === 0) {
        setSearchResult(`Nenhum produto encontrado${selectedCategory ? ` na categoria "${selectedCategory}"` : ` para "${searchTerm}"`}${stores.length === 1 ? ` na ${stores[0]}` : ' nas lojas selecionadas'}.`);
        return;
      }

      const mappedProducts = productsArray.map(product => {
        const prices = product.offers && product.offers[0] && product.offers[0].prices
          ? product.offers[0].prices
          : [];
        const latestPrice = prices.length > 0
          ? prices.sort((a, b) => new Date(b.date) - new Date(a.date))[0].value
          : null;

        return {
          id: product._id || product.id,
          name: product.name,
          imageUrl: product.imageUrl || '/images/placeholder-phone.jpg',
          size: product.memory ? [product.memory] : [],
          color: product.color ? [product.color] : [],
          price: latestPrice ? [`${latestPrice} ${product.currency}`] : [],
        };
      });

      setProducts(mappedProducts);
      setSearchResult(
        `Encontrados ${productsArray.length} produtos${selectedCategory ? ` na categoria "${selectedCategory}"` : ` para "${searchTerm}"`} na Amazon.`
      );
    } catch (error) {
      console.error('Erro ao buscar produtos:', error.response?.data || error.message);
      setScrapeError(error.response?.data?.msg || 'Erro ao buscar produtos na Amazon.');
    }
  };

  const selectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchTerm('');
    handleSearch();
  };

  return (
    <div>
      {userPlan === 'freemium' ? (
        <Layout pageTitle="Homepage">
          <div className={styles.searchContainer}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Escreva um produto a procurar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button className={styles.searchButton} onClick={handleSearch}>
                Buscar
              </button>
            </div>

            {scrapeError && (
              <p className={styles.scrapeError}>{scrapeError}</p>
            )}

            {products.length > 0 && (
              <div className={styles.productsGrid}>
                {products.map(product => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={styles.productCardLink}
                  >
                    <div key={product.id} className={styles.productCard}>
                      <h3>{product.name}</h3>
                      <div className={styles.productImage}>
                        <img
                          alt={product.name}
                          src={product.imageUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => (e.target.src = '/images/placeholder-phone.jpg')}
                        />
                      </div>
                      <div className={styles.storagePriceRow}>
                        <p className={styles.storage}>
                          <FaMemory className={styles.detailIcon} />
                          <span>
                            {product.size.length > 0 ? product.size[0] : 'N/A'}
                          </span>
                        </p>
                        <div className={styles.price}>
                          <span className={styles.priceLabel}>Preço Médio</span>
                          <span className={styles.priceValue}>
                            {product.price.length > 0 ? product.price[0] : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className={styles.categoriesSection}>
              <h3>Escolha uma categoria</h3>
              <div className={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className={`${styles.categoryCard} ${
                      selectedCategory === category.name ? styles.selected : ''
                    }`}
                    onClick={() => selectCategory(category.name)}
                  >
                    <h4>{category.name}</h4>
                    <div className={styles.categoryImage}>
                      {category.image === 'placeholder' ? (
                        'Imagem Placeholder'
                      ) : (
                        <img
                          src={category.image}
                          alt={category.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }}
                          onError={(e) => (e.target.src = '/images/placeholder.jpg')}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {searchResult && (
              <div className={styles.searchResult}>
                {searchResult}
              </div>
            )}
          </div>
        </Layout>
      ) : userPlan === 'premium' ? (
        <Layout pageTitle="Homepage">
          <div className={styles.searchContainer}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Escreva um produto a procurar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button className={styles.searchButton} onClick={handleSearch}>
                Buscar
              </button>
            </div>

            {scrapeError && (
              <p className={styles.scrapeError}>{scrapeError}</p>
            )}

            {products.length > 0 && (
              <div className={styles.productsGrid}>
                {products.map(product => (
                  <div key={product.id} className={styles.productCard}>
                    <h3>{product.name}</h3>
                    <div className={styles.productImage}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => (e.target.src = '/images/placeholder-phone.jpg')}
                      />
                    </div>
                    <div className={styles.storagePriceRow}>
                      <p className={styles.storage}>
                        <FaMemory className={styles.detailIcon} />
                        <span>
                          {product.size.length > 0 ? product.size[0] : 'N/A'}
                        </span>
                      </p>
                      <div className={styles.price}>
                        <span className={styles.priceLabel}>Preço Médio</span>
                        <span className={styles.priceValue}>
                          {product.price.length > 0 ? product.price[0] : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.categoriesSection}>
              <h3>Escolha uma categoria</h3>
              <div className={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className={`${styles.categoryCard} ${
                      selectedCategory === category.name ? styles.selected : ''
                    }`}
                    onClick={() => selectCategory(category.name)}
                  >
                    <h4>{category.name}</h4>
                    <div className={styles.categoryImage}>
                      {category.image === 'placeholder' ? (
                        'Imagem Placeholder'
                      ) : (
                        <img
                          src={category.image}
                          alt={category.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }}
                          onError={(e) => (e.target.src = '/images/placeholder.jpg')}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {searchResult && (
              <div className={styles.searchResult}>
                {searchResult}
              </div>
            )}
          </div>
        </Layout>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
};

export default Homepage;