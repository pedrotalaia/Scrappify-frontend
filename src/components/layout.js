import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Layout.module.scss';

const Layout = ({ children, pageTitle, headerActions }) => {
  const router = useRouter();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Scrappify</h2>
        </div>
        <nav className={styles.nav}>
          <ul>
            <li>
              <Link href="/homepage">Homepage</Link>
            </li>
            <li>
              <Link href="/search">Pesquisa</Link>
            </li>
            <li>
              <Link href="/favoritespage">Favoritos</Link>
            </li>
            <li>
              <Link href="/account">Minha Conta</Link>
            </li>
          </ul>
        </nav>
      </aside>

      <header className={styles.header}>
        <h1>{pageTitle}</h1>
        {router.pathname === "/account" && headerActions && (
          <div className={styles.headerActionsContainer}>{headerActions}</div>
        )}
      </header>

      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;