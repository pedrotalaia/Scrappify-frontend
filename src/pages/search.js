import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { FaSearch, FaMemory } from 'react-icons/fa';
import Layout from '../components/layout';
import styles from '../styles/search.module.scss';
import { jwtDecode } from 'jwt-decode';

const SearchPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [originalProducts, setOriginalProducts] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const [userName, setUserName] = useState('');
  const [priceFilters, setPriceFilters] = useState([]);
  const [customPriceRange, setCustomPriceRange] = useState({ min: 0, max: 3000 });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState(['Amazon']);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setUserPlan(decodedToken.plan);
        setUserName(decodedToken.name);
        console.log('Plano do usuário:', decodedToken.plan);
        if (decodedToken.plan === 'freemium') {
          setSelectedVendors(['Amazon']);
        } else if (decodedToken.plan === 'premium' || decodedToken.plan === 'pro' || decodedToken.plan === 'agency') {
          setSelectedVendors([]); 
        }
      }
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router]);

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      setHasSearched(false);
      setError('Por favor, insira um produto para a procura.');
      setOriginalProducts([]);
      setProducts([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError('');
    setScrapeError('');
    setOriginalProducts([]);
    setProducts([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setScrapeError('Token de autenticação não encontrado. Faça login novamente.');
        window.location.href = '/';
        return;
      }

      const vendorsToUse = userPlan === 'freemium' ? ['Amazon'] : selectedVendors.length > 0 ? selectedVendors : ['Amazon', 'Worten', 'MediaMarket'];
      const requestBody = {
        query: searchTerm.trim(),
        stores: vendorsToUse,
      };

      console.log('Enviando requisição para /api/products/search:', requestBody);

      const response = await axios.post(
        'http://localhost:5000/api/products/search',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
        setError(`Nenhum produto encontrado para "${searchTerm}" na${vendorsToUse.length === 1 ? ' ' + vendorsToUse[0] : 's lojas ' + vendorsToUse.join(' e ')}.`);
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
          source: product.offers && product.offers[0] ? product.offers[0].source : vendorsToUse[0], 
        };
      });

      setOriginalProducts(mappedProducts);
      setProducts(mappedProducts); 
    } catch (error) {
      console.error('Erro ao buscar produtos:', error.response?.data || error.message);
      setScrapeError(error.response?.data?.msg || `Erro ao buscar produtos na${vendorsToUse.length === 1 ? ' ' + vendorsToUse[0] : 's lojas ' + vendorsToUse.join(' e ')}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (vendor) => {
    if (userPlan === 'freemium') return; 
    setSelectedVendors(prev =>
      prev.includes(vendor)
        ? prev.filter(v => v !== vendor)
        : [...prev, vendor]
    );
    console.log('Vendedores selecionados:', selectedVendors);
  };

  const getPriceValue = (priceStr) => {
    if (!priceStr || !Array.isArray(priceStr) || priceStr.length === 0) return 0;
    const value = parseFloat(priceStr[0].replace(/[^0-9.]/g, ''));
    console.log(`Extrair preço de "${priceStr[0]}": ${value}`);
    return isNaN(value) ? 0 : value;
  };

  const handlePriceFilterChange = (range) => {
    setPriceFilters(prevFilters =>
      prevFilters.includes(range)
        ? prevFilters.filter(f => f !== range)
        : [...prevFilters, range]
    );
    console.log('Filtros de preço selecionados:', priceFilters);
  };

  const handleCustomPriceRangeChange = (e) => {
    const { name, value } = e.target;
    setCustomPriceRange(prev => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
    console.log('Intervalo de preço personalizado:', customPriceRange);
  };

  useEffect(() => {
    if (!hasSearched || originalProducts.length === 0) {
      setProducts([]);
      return;
    }

    const filtered = originalProducts.filter(product => {
      const priceValue = getPriceValue(product.price);
      const isInPredefinedRange = priceFilters.length === 0 || priceFilters.some(range => {
        const [min, max] = range.split('-').map(Number);
        const maxValue = max || Infinity;
        const result = priceValue >= min && priceValue < maxValue;
        console.log(`Verificar ${product.name} (${priceValue}€) em ${range}: ${result}`);
        return result;
      });
      const isInCustomRange = priceValue >= customPriceRange.min && priceValue <= customPriceRange.max;
      console.log(`Verificar ${product.name} (${priceValue}€) em ${customPriceRange.min}-${customPriceRange.max}: ${isInCustomRange}`);

      const isValidVendor = userPlan === 'freemium'
        ? product.source === 'Worten' 
        : selectedVendors.length === 0 || selectedVendors.includes(product.source);
      console.log(`Verificar ${product.name} como produto de ${product.source}: ${isValidVendor}`);

      return isInPredefinedRange && isInCustomRange && isValidVendor;
    });

    setProducts(filtered);
  }, [priceFilters, customPriceRange, selectedVendors, userPlan, hasSearched, originalProducts]);

  const priceRanges = [
    '0-200', '200-400', '400-600', '600-800', '800-1000',
    '1000-1200', '1200-1500', '1500-2000+'
  ];

  const vendors = ['Amazon', 'Worten', 'MediaMarket'];
  const vendorLogos = {
    Amazon: '/images/amazon_logo.png',
    Worten: '/images/worten_logo.png',
    MediaMarket: '/images/mediamarkt_logo.png',
  };

  return (
    <Layout pageTitle="Pesquisa de Produtos">
      <div className={styles.container}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            <FaSearch />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.contentSidebar}>
            <div className={styles.filterSection}>
              <h3>Preço</h3>
              <div className={styles.filterOptions}>
                {priceRanges.map(range => (
                  <label key={range} className={styles.filterLabel}>
                    <input
                      type="checkbox"
                      value={range}
                      checked={priceFilters.includes(range)}
                      onChange={() => handlePriceFilterChange(range)}
                    />
                    {range}€
                  </label>
                ))}
                <div className={styles.customPriceRange}>
                  <label>
                    Intervalo Personalizado:
                    <div>
                      <input
                        type="range"
                        name="min"
                        min="0"
                        max="3000"
                        value={customPriceRange.min}
                        onChange={handleCustomPriceRangeChange}
                      />
                      <span>{customPriceRange.min}€</span>
                    </div>
                    <div>
                      <input
                        type="range"
                        name="max"
                        min="0"
                        max="3000"
                        value={customPriceRange.max}
                        onChange={handleCustomPriceRangeChange}
                      />
                      <span>{customPriceRange.max}€</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.vendorsSection}>
              <h3>Vendedores</h3>
              <div className={styles.vendorsOptions}>
                {vendors.map(vendor => {
                  const logoSrc = vendorLogos[vendor] || '/images/placeholder-logo.png';
                  console.log(`Carregando logo para ${vendor}: ${logoSrc}`);
                  return (
                    <label key={vendor} className={styles.vendorsLabel}>
                      <input
                        type="checkbox"
                        value={vendor}
                        checked={userPlan === 'freemium' ? vendor === 'Worten' : selectedVendors.includes(vendor)}
                        onChange={() => handleVendorChange(vendor)}
                        disabled={userPlan === 'freemium'}
                      />
                      <img
                        src={logoSrc}
                        alt={`${vendor} logo`}
                        className={styles.vendorLogo}
                        onError={(e) => (e.target.style.display = 'none')} 
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.contentMain}>
            {loading && <div className={styles.loading}>Carregando...</div>}
            {error && <div className={styles.error}>{error}</div>}
            {scrapeError && <div className={styles.error}>{scrapeError}</div>}

            {products.length > 0 ? (
              <div className={styles.productsGrid}>
                {products.map(product => {
                  console.log('Produto renderizado:', { id: product.id, name: product.name, price: product.price });
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className={styles.productCardLink}
                    >
                      <div className={styles.productCard}>
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
                  );
                })}
              </div>
            ) : hasSearched ? (
              <p>Nenhum produto encontrado para os filtros selecionados.</p>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;