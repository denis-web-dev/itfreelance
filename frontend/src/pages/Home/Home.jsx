import { Link } from 'react-router-dom';
import styles from './Home.module.css';
// import heroArt from '../../assets/img-home/img-main.jpg';
// import heroArt from '../../assets/img-home/gif-main.gif';
import heroVideo from '../../assets/img-home/video-main.webm';
import logo from '../../assets/img-header/Logo.png';
import UserIcon from '../../components/Icons/UserIcon';
import logoFooter from '../../assets/img-home/logo-footer.png';

function Home() {
	return (
		<div className={styles['fullWidthBlock']}>
			<div className={styles['container']}>
				<header className={styles.header}>
					<div className={styles.headerInner}>
						<Link to="/" className={styles.logo}>
							<img src={logo} alt="Logotip" aria-label="Itfreelance — на главную" />
						</Link>
						<nav className={styles.headerNav}>
							<Link to="/privacy" className={styles.supportLink}>
								Поддержка
							</Link>
							<Link to="/login" className={styles.loginBtn}>
								<span className={styles.loginIcon} aria-hidden="true">
									<UserIcon className={styles.userIcon} />
								</span>
								Войти
							</Link>
						</nav>
					</div>
				</header>

				<main className={styles.main}>
					<section className={styles.hero}>
						<h1 className={styles.heroTitle}>
							Фриланс-услуги
							<br />в один клик
						</h1>

						<Link to="/create-account" className={styles.ctaBtn}>
							Присоединиться
						</Link>

						<div className={styles.artWrap}>
							<video src={heroVideo} autoPlay loop={true} muted playsInline></video>
						</div>
					</section>
				</main>

				<footer className={styles.footer}>
					<div className={styles.footerBrand}>
						<Link to="/privacy" className={styles.contactsPill}>
							Контакты
						</Link>
						<img src={logoFooter} alt="itfreelance" className={styles.logoFooter} />
					</div>

					<div className={styles.footerBottom}>
						<p className={styles.copy}>© Itfreelance • Monochrome Studio • 2026</p>
						<Link to="/privacy" className={styles.privacy}>
							Политика конфиденциальности
						</Link>
					</div>
				</footer>
			</div>
		</div>
	);
}

export default Home;
