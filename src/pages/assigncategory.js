import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Layout from '../components/layout.js';
import layoutStyles from '../styles/Layout.module.scss';
import styles from '../styles/AssignCategory.module.scss';
import axios from 'axios';

const AssignCategory = () => {
  const [userRole, setUserRole] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = [
    'Tech & Electrónica',
    'Fashion',
    'Home',
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
          fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/products/list-no-category', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const productsData = response.data;
      console.log('Produtos sem categoria recebidos:', productsData);
      let productsArray = [];

      if (Array.isArray(productsData)) {
        productsArray = productsData;
      } else if (productsData.products && Array.isArray(productsData.products)) {
        productsArray = productsData.products;
      } else {
        setErrorMessage('Formato de dados inválido retornado pelo backend.');
        return;
      }

      setProducts(productsArray);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.msg || 'Erro ao buscar produtos sem categoria.');
      setLoading(false);
    }
  };

  const handleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleAssignCategory = async () => {
    if (selectedProducts.length === 0) {
      setErrorMessage('Por favor, selecione pelo menos um produto.');
      return;
    }

    if (!selectedCategory) {
      setErrorMessage('Por favor, selecione uma categoria.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/products/assign-category',
        {
          productIds: selectedProducts,
          category: selectedCategory,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(`Categoria atribuída com sucesso a ${response.data.modifiedCount} produtos.`);
      setErrorMessage('');
      setSelectedProducts([]);
      setSelectedCategory('');

      const updatedProducts = products.filter(product => !selectedProducts.includes(product._id));
      setProducts(updatedProducts);

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Erro ao atribuir categoria:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.msg || 'Erro ao atribuir categoria.');
      setSuccessMessage('');
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <Layout pageTitle="Atribuir Categoria">
      <div className={styles.adminContainer}>
        <h2>Atribuir Categoria aos Produtos</h2>

        {errorMessage && <p className={layoutStyles.errorMessage}>{errorMessage}</p>}
        {successMessage && <p className={layoutStyles.successMessage}>{successMessage}</p>}

        <div className={styles.categorySelection}>
          <label htmlFor="categorySelect">Selecionar Categoria:</label>
          <select
            id="categorySelect"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Escolha uma categoria</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.productsList}>
          <h3>Produtos Sem Categoria</h3>
          {products.length === 0 ? (
            <p>Nenhum produto sem categoria encontrado.</p>
          ) : (
            <ul>
              {products.map(product => (
                <li key={product._id} className={styles.productItem}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => handleProductSelection(product._id)}
                  />
                  <span>{product.name}</span>
                  <span className={styles.currentCategory}>
                    (Categoria Atual: {product.category || 'Nenhuma'})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className={styles.assignButton}
          onClick={handleAssignCategory}
          disabled={selectedProducts.length === 0 || !selectedCategory}
        >
          Atribuir Categoria
        </button>
      </div>
    </Layout>
  );
};

export default AssignCategory;