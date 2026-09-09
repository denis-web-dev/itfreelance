import { Link } from 'react-router-dom';
import clsx from 'clsx';
import CloseButton from '../../components/ui/CloseButton/CloseButton';
import styles from './CreateAccount.module.css';

function CreateAccount() {
  const handleClose = () => {
    // Логика закрытия
    console.log('Close CreateAccount');
  };

  const handleCloseCustomer = () => {
    console.log('Close Customer');
  };

  const handleCloseFreelancer = () => {
    console.log('Close Freelancer');
  };

  return (
    <div className={styles['wrapper-create']}>
      <div className={styles['container']}>
        <div className={styles['block-bg']}>
          <h1
            className={clsx(styles['main-title-create'], styles['main-title'])}
          >
            Создать аккаунт
          </h1>
          <CloseButton
            onClick={handleClose}
            size="large"
            variant="dark"
            className={styles['block-bg-close-btn-create']}
            ariaLabel="Закрыть форму создания аккаунта"
          />
          <svg
            className={styles['block-bg-svg']}
            width="1890"
            height="870"
            viewBox="0 0 1890 870"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1825.21 62.7106C1813.5 74.4264 1813.5 93.4213 1825.21 105.137L1881.21 161.137C1886.84 166.763 1890 174.394 1890 182.35V840C1890 856.569 1876.57 870 1860 870H30C13.4315 870 0 856.569 0 840V30C0 13.4315 13.4315 0 30 0H1815.5C1842.22 0 1855.61 32.3143 1836.71 51.2132L1825.21 62.7106Z"
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
            {/* Заказчик */}
            <div className={styles.customer}>
              <div className={styles['customer-block']}>
                <Link className={styles['customer-link']} to="/register">
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

                {/* ✅ Кнопка закрытия заказчика */}
                <CloseButton
                  onClick={handleCloseCustomer}
                  size="medium"
                  variant="transparent"
                  className={clsx(
                    styles['account-close-btn'],
                    styles['customer-close-btn']
                  )}
                  ariaLabel="Закрыть выбор заказчика"
                />

                <span
                  className={clsx(
                    styles['account-name'],
                    styles['customer-account-name']
                  )}
                >
                  Я заказчик
                </span>
              </div>
            </div>

            {/* Исполнитель */}
            <div className={styles.freelancer}>
              <div className={styles['freelancer-block']}>
                <Link className={styles['freelancer-link']} to="/register">
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

                {/* ✅ Кнопка закрытия исполнителя */}
                <CloseButton
                  onClick={handleCloseFreelancer}
                  size="medium"
                  variant="transparent"
                  className={clsx(
                    styles['account-close-btn'],
                    styles['freelancer-close-btn']
                  )}
                  ariaLabel="Закрыть выбор фрилансера"
                />

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
            <span className={styles['account-entrance']}>Есть аккаунт?</span>
            <Link className={styles['account-link-enter']} to="/login">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
