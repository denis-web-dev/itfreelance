// src/components/Profile/ProfilePortfolio/ProfilePortfolio.jsx
import { useState } from 'react';
import PortfolioCard from './PortfolioCard';
import styles from './ProfilePortfolio.module.css';

export default function ProfilePortfolio() {
  const [portfolioItems, setPortfolioItems] = useState([
    // {
    //   id: 1,
    //   image: 'https://via.placeholder.com/475x384/7b7b7b/ffffff?text=Работа+1',
    //   title: 'Работа 1',
    // },
    // {
    //   id: 2,
    //   image: 'https://via.placeholder.com/475x384/7b7b7b/ffffff?text=Работа+2',
    //   title: 'Работа 2',
    // },
    // {
    //   id: 3,
    //   image: 'https://via.placeholder.com/475x384/7b7b7b/ffffff?text=Работа+3',
    //   title: 'Работа 3',
    // },
  ]);

  const handleAddCard = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem = {
          id: Date.now(),
          image: reader.result,
          title: file.name,
        };
        setPortfolioItems([...portfolioItems, newItem]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Редактирование работы
  const handleEditCard = (id) => {
    console.log('Редактировать работу:', id);
    // TODO: Открыть модалку с данными работы
  };

  // Удаление работы
  const handleDeleteCard = (id) => {
    setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.profilePortfolio}>
      <h2 className={styles.profileTitle}>Портфолио</h2>

      <div className={styles.profileGrid}>
        {portfolioItems.map((item) => (
          <PortfolioCard
            key={item.id}
            id={item.id}
            image={item.image}
            title={item.title}
            onDelete={handleDeleteCard}
            onEdit={handleEditCard}
          />
        ))}

        <PortfolioCard isAdd={true} onAdd={handleAddCard} />
        <PortfolioCard isAdd={true} onAdd={handleAddCard} />
        <PortfolioCard isAdd={true} onAdd={handleAddCard} />
        <PortfolioCard isAdd={true} onAdd={handleAddCard} />
      </div>
    </div>
  );
}
