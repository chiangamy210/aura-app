import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import quotes from './quotes.json';
import './App.css';

interface Quote {
  category: string;
  quote: string;
}

function App() {
  const [drawnCards, setDrawnCards] = useState<Quote[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(true);
    }
  }, [countdown]);

  const drawCards = (num: number) => {
    const shuffled = quotes.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, num);
    setDrawnCards(selected);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Aura</h1>
      <p className="text-center">
        Think of a topic or an issue that you want to know...
      </p>
      {!showButtons && <p className="text-center">...{countdown}</p>}
      {showButtons && (
        <div className="d-flex justify-content-center mb-4">
          <button className="btn btn-primary me-2" onClick={() => drawCards(1)}>
            Draw One Card
          </button>
          <button className="btn btn-secondary" onClick={() => drawCards(3)}>
            Draw Three Cards
          </button>
        </div>
      )}
      <div className={drawnCards.length === 1 ? "d-flex justify-content-center" : "row"}>
        {drawnCards.map((card, index) => (
          <div className={drawnCards.length === 1 ? "col-md-6" : "col-md-4 mb-4"} key={index}>
            <div className="card h-100 card-reveal" style={{ animationDelay: `${index * 0.5}s` }}>
              <div className="card-body">
                <h5 className="card-title">{card.category}</h5>
                <p className="card-text">{card.quote}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
