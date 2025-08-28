import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { auth, getSavedCards, deleteCard } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

interface Card {
  id: string;
  title: string;
  quote: string;
  image: string;
  time: string;
  ai_reply: string;
}

const SavedCards = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDeleteNotice, setShowDeleteNotice] = useState(false);
  const [groupedCards, setGroupedCards] = useState<{ [key: string]: Card[] }>(
    {}
  );

  useEffect(() => {
    if (showDeleteNotice) {
      const timer = setTimeout(() => {
        setShowDeleteNotice(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteNotice]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getSavedCards(user.uid)
        .then((cards) => {
          const sortedCards = cards.sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          );
          setSavedCards(sortedCards);
          setGroupedCards(groupCardsByDate(sortedCards));
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching saved cards: ", error);
          setLoading(false);
        });
    } else {
      setSavedCards([]); // Clear cards if user logs out
      setGroupedCards({});
    }
  }, [user]);

  const handleDelete = async () => {
    if (user && cardToDelete) {
      await deleteCard(user.uid, cardToDelete);
      const newSavedCards = savedCards.filter(
        (card) => card.id !== cardToDelete
      );
      setSavedCards(newSavedCards);
      setGroupedCards(groupCardsByDate(newSavedCards));
      setShowConfirmDialog(false);
      setCardToDelete(null);
      setShowDeleteNotice(true);
    }
  };

  const openModal = (card: Card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedCard(null);
    setShowModal(false);
  };

  const groupCardsByDate = (cards: Card[]) => {
    const groupedCards: { [key: string]: Card[] } = {};
    cards.forEach((card) => {
      const date = new Date(card.time).toLocaleDateString();
      if (!groupedCards[date]) {
        groupedCards[date] = [];
      }
      groupedCards[date].push(card);
    });
    return groupedCards;
  };

  if (loading) {
    return <p>Loading your collection...</p>;
  }

  if (!user) {
    return <p>Please log in to see your collection.</p>;
  }

  return (
    <div>
      <div className={`save-notification ${showDeleteNotice ? "show" : ""}`}>
        {t("card_deleted_notice")}
      </div>
      <h2>{t('saved_cards_title')}</h2>
      {savedCards.length === 0 ? (
        <p>Your collection is empty.</p>
      ) : (
        <>
          {Object.keys(groupedCards).map((date) => (
            <div key={date}>
              <h2>{date}</h2>
              <div className="saved-cards-grid">
                {groupedCards[date].map((card) => (
                  <div
                    className="card-preview"
                    key={card.id}
                    onClick={() => openModal(card)}
                  >
                    <img src={card.image} alt={card.title} />
                    <div className="card-preview-overlay">
                      <p className="card-preview-title">{card.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {showModal && selectedCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <img
                src={selectedCard.image}
                className="card-img-top"
                alt={selectedCard.title}
              />
              <p className="card-timestamp">
                Saved on: {new Date(selectedCard.time).toLocaleString()}
              </p>
            </div>
            <div className="card-body">
              <h5 className="card-title">{selectedCard.title}</h5>
              <p className="card-text">{selectedCard.quote}</p>
              {selectedCard.ai_reply && (
                <p className="card-text">{selectedCard.ai_reply}</p>
              )}
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowConfirmDialog(true);
                  setCardToDelete(selectedCard.id);
                  closeModal();
                }}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t('confirm_delete')}</h3>
            <div className="modal-buttons">
              <button className="btn btn-danger" onClick={handleDelete}>
                {t('delete')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setCardToDelete(null);
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedCards;
