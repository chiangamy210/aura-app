

import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import quotes from './quotes.json';
import './App.css';

interface Quote {
  category: string;
  quote: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const [drawnCards, setDrawnCards] = useState<Quote[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Aura - Your Gentle Guide';
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
    setAiResponse('');
  };

  const handleExplainClick = (card: Quote) => {
    setSelectedCard(card);
    const question = prompt('What is your question about this card?');
    if (question) {
      setUserQuestion(question);
      getExplanation(card, question);
    }
  };

  const getExplanation = async (card: Quote, question: string) => {
    setIsLoading(true);
    setAiResponse('');

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setAiResponse('Error: API Key not found. Please make sure you have set up your .env file with your VITE_GEMINI_API_KEY.');
      setIsLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const prompt = `Explain the following quote in a warm, gentle, and insightful way, in the context of my question.\n\nQuote: "${card.quote}"\nCategory: "${card.category}"\n\nMy question: "${question}"\n\nKeep the explanation concise, kind, and easy to understand.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setAiResponse(text);
    } catch (error) {
      console.error('Error getting explanation:', error);
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAiResponse(`Sorry, I had trouble getting an explanation.\n\nError details: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Aura</h1>
        <p>Think of a topic or an issue that you want to know...</p>
        {!showButtons && <p className="countdown">...{countdown}</p>}
      </header>

      {showButtons && drawnCards.length === 0 && (
        <div className="draw-button-container">
          <button className="btn btn-primary" onClick={() => drawCards(1)}>
            Draw a Card
          </button>
        </div>
      )}

      <main className="card-container">
        {drawnCards.map((card, index) => (
          <div
            className="card card-reveal"
            key={index}
            style={{ animationDelay: `${index * 0.5}s` }}
          >
            <div className="card-body">
              <h5 className="card-title">{card.category}</h5>
              <p className="card-text">{card.quote}</p>
              <button
                className="btn btn-info btn-sm"
                onClick={() => handleExplainClick(card)}
              >
                Explain More
              </button>
            </div>
          </div>
        ))}
      </main>

      {drawnCards.length > 0 && (
        <div className="start-over-container">
          <button className="btn btn-secondary" onClick={handleStartOver}>
            Draw Another Card
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Getting your explanation...</p>
        </div>
      )}

      {aiResponse && (
        <section className="ai-response">
          <h3>An Insight for You</h3>
          <ReactMarkdown>{aiResponse}</ReactMarkdown>
        </section>
      )}
    </div>
  );
}

export default App;
