import { useState, useEffect } from 'react';
import { auth, getSavedCards } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface Card {
  id: string;
  title: string;
  quote: string;
  image: string;
}

const SavedCards = () => {
  const [user, setUser] = useState<User | null>(null);
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

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
          setSavedCards(cards);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching saved cards: ", error);
          setLoading(false);
        });
    } else {
      setSavedCards([]); // Clear cards if user logs out
    }
  }, [user]);

  if (loading) {
    return <p>Loading saved cards...</p>;
  }

  if (!user) {
    return <p>Please log in to see your saved cards.</p>;
  }

  return (
    <div>
      <h2>Your Saved Cards</h2>
      {savedCards.length === 0 ? (
        <p>You have no saved cards.</p>
      ) : (
        <div className="saved-cards-grid">
          {savedCards.map((card) => (
            <div className="card" key={card.id}>
              <img src={card.image} className="card-img-top" alt={card.title} />
              <div className="card-body">
                <h5 className="card-title">{card.title}</h5>
                <p className="card-text">{card.quote}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedCards;