import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './CreateAccount.module.css';
function CreateAccount() {
  return (
    <div className={styles['wrapper-create']}>
      {' '}
      <div className={styles['container']}>
        {' '}
        <div className={styles['block-bg']}>
          {' '}
          <h1
            className={clsx(styles['main-title-create'], styles['main-title'])}
          >
            Создать аккаунт
          </h1>{' '}
          <button
            className={clsx(
              styles['block-bg-close-btn-create'],
              styles['block-bg-close-btn']
            )}
            aria-label="Закрыть форму создания аккаунта"
          >
            <svg
              className={styles['block-bg-close-svg']}
              viewBox="0 0 19 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9.95 0C10.1887 0 10.4176 0.0948213 10.5864 0.263604C10.7552 0.432387 10.85 0.661305 10.85 0.9V7.65H17.6C17.8387 7.65 18.0676 7.74482 18.2364 7.9136C18.4052 8.08239 18.5 8.31131 18.5 8.55V9.45C18.5 9.68869 18.4052 9.91761 18.2364 10.0864C18.0676 10.2552 17.8387 10.35 17.6 10.35H10.85V17.1C10.85 17.3387 10.7552 17.5676 10.5864 17.7364C10.4176 17.9052 10.1887 18 9.95 18H9.05C8.81131 18 8.58239 17.9052 8.4136 17.7364C8.24482 17.5676 8.15 17.3387 8.15 17.1V10.35H1.4C1.16131 10.35 0.932387 10.2552 0.763604 10.0864C0.594821 9.91761 0.5 9.68869 0.5 9.45V8.55C0.5 8.31131 0.594821 8.08239 0.763604 7.9136C0.932387 7.74482 1.16131 7.65 1.4 7.65H8.15V0.9C8.15 0.661305 8.24482 0.432387 8.4136 0.263604C8.58239 0.0948213 8.81131 0 9.05 0H9.95Z"
                fill="#FFFFF"
              />
            </svg>
          </button>
          <svg
            className={styles['block-bg-svg']}
            width="1410"
            height="770"
            viewBox="0 0 1410 770"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1338.69 0C1360.04 0 1370.74 25.8136 1355.64 40.9107C1346.28 50.2696 1346.28 65.4433 1355.64 74.8022L1401.21 120.375C1406.84 126.001 1410 133.632 1410 141.588V740C1410 756.569 1396.57 770 1380 770H30C13.4315 770 0 756.569 0 740V30C0 13.4315 13.4315 0 30 0H1338.69Z"
              fill="#0CB761"
            />
          </svg>
          <svg
            className={styles['bg-mobile-svg']}
            width="301"
            height="548"
            viewBox="0 0 301 548"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="0.5" width="300" height="548" rx="20" fill="#0CB761" />
          </svg>
          <div className={styles.account}>
            {' '}
            <div className={styles.customer}>
              <div className={styles['customer-block']}>
                <Link className={styles['customer-link']} to="/registration">
                  {' '}
                  <svg
                    className={styles['customer-block-svg']}
                    width="368"
                    height="381"
                    viewBox="0 0 368 381"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M231.204 11.9368C229.06 3.93481 220.835 -0.813929 212.833 1.3302L15.7843 54.1293C5.11502 56.9881 -1.21663 67.9549 1.6422 78.6242L78.5115 365.504C81.3703 376.173 92.337 382.505 103.006 379.646L352.215 312.871C362.885 310.012 369.216 299.045 366.357 288.376L303.723 54.622C301.579 46.62 293.354 41.8713 285.352 44.0154L257.34 51.5212C249.338 53.6653 241.113 48.9166 238.969 40.9146L231.204 11.9368Z"
                      fill="#ECA4D7"
                    />
                  </svg>
                </Link>
                <button
                  className={clsx(
                    styles['account-close-btn'],
                    styles['customer-close-btn']
                  )}
                  aria-label="Закрыть выбор заказчика"
                >
                  {' '}
                  <svg
                    className={styles['close-btn-svg']}
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M9.95 0C10.1887 0 10.4176 0.0948213 10.5864 0.263604C10.7552 0.432387 10.85 0.661305 10.85 0.9V7.65H17.6C17.8387 7.65 18.0676 7.74482 18.2364 7.9136C18.4052 8.08239 18.5 8.31131 18.5 8.55V9.45C18.5 9.68869 18.4052 9.91761 18.2364 10.0864C18.0676 10.2552 17.8387 10.35 17.6 10.35H10.85V17.1C10.85 17.3387 10.7552 17.5676 10.5864 17.7364C10.4176 17.9052 10.1887 18 9.95 18H9.05C8.81131 18 8.58239 17.9052 8.4136 17.7364C8.24482 17.5676 8.15 17.3387 8.15 17.1V10.35H1.4C1.16131 10.35 0.932387 10.2552 0.763604 10.0864C0.594821 9.91761 0.5 9.68869 0.5 9.45V8.55C0.5 8.31131 0.594821 8.08239 0.763604 7.9136C0.932387 7.74482 1.16131 7.65 1.4 7.65H8.15V0.9C8.15 0.661305 8.24482 0.432387 8.4136 0.263604C8.58239 0.0948213 8.81131 0 9.05 0H9.95Z"
                      fill="#1A1A1A"
                    />
                  </svg>
                </button>
                <span
                  className={clsx(
                    styles['account-name'],
                    styles['customer-account-name']
                  )}
                >
                  Я заказчик
                </span>{' '}
              </div>
            </div>
            <div className={styles.freelancer}>
              {' '}
              <div className={styles['freelancer-block']}>
                <Link className={styles['freelancer-link']} to="/registration">
                  {' '}
                  <svg
                    className={styles['freelancer-block-svg']}
                    width="353"
                    height="395"
                    viewBox="0 0 353 395"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M310.662 72.5244C312.806 64.5224 308.057 56.2973 300.055 54.1532L103.007 1.35412C92.3372 -1.50472 81.3704 4.82693 78.5116 15.4963L1.64235 302.376C-1.21649 313.046 5.11516 324.012 15.7845 326.871L264.993 393.646C275.663 396.505 286.629 390.174 289.488 379.504L352.122 145.75C354.267 137.748 349.518 129.523 341.516 127.379L313.504 119.873C305.502 117.729 300.753 109.504 302.897 101.502L310.662 72.5244Z"
                      fill="#FFCB30"
                    />
                  </svg>
                </Link>
                <button
                  className={clsx(
                    styles['account-close-btn'],
                    styles['freelancer-close-btn']
                  )}
                  aria-label="Закрыть выбор фрилансера"
                >
                  <svg
                    className={styles['close-btn-svg']}
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M9.95 0C10.1887 0 10.4176 0.0948213 10.5864 0.263604C10.7552 0.432387 10.85 0.661305 10.85 0.9V7.65H17.6C17.8387 7.65 18.0676 7.74482 18.2364 7.9136C18.4052 8.08239 18.5 8.31131 18.5 8.55V9.45C18.5 9.68869 18.4052 9.91761 18.2364 10.0864C18.0676 10.2552 17.8387 10.35 17.6 10.35H10.85V17.1C10.85 17.3387 10.7552 17.5676 10.5864 17.7364C10.4176 17.9052 10.1887 18 9.95 18H9.05C8.81131 18 8.58239 17.9052 8.4136 17.7364C8.24482 17.5676 8.15 17.3387 8.15 17.1V10.35H1.4C1.16131 10.35 0.932387 10.2552 0.763604 10.0864C0.594821 9.91761 0.5 9.68869 0.5 9.45V8.55C0.5 8.31131 0.594821 8.08239 0.763604 7.9136C0.932387 7.74482 1.16131 7.65 1.4 7.65H8.15V0.9C8.15 0.661305 8.24482 0.432387 8.4136 0.263604C8.58239 0.0948213 8.81131 0 9.05 0H9.95Z"
                      fill="#1A1A1A"
                    />
                  </svg>
                </button>
                <span
                  className={clsx(
                    styles['account-name'],
                    styles['freelancer-account-name']
                  )}
                >
                  Я исполнитель
                </span>
              </div>
            </div>
          </div>
          <div
            className={clsx(
              styles['account-link-create'],
              styles['account-link']
            )}
          >
            {' '}
            <span className={styles['account-entrance']}>Есть аккаунт?</span>
            <Link className={styles['account-link-enter']} to="/login">
              Войти
            </Link>{' '}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
