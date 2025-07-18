import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import HowAuraWorks from './HowAuraWorks';
import HowToAsk from './HowToAsk';
import './App.css';

interface Quote {
  title: string;
  quote: string;
  image: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const quoteModules = {
  en: () => import('./quotes.en.json'),
  es: () => import('./quotes.es.json'),
  'zh-TW': () => import('./quotes.zh-TW.json'),
};

function Home() {
  const { t, i18n } = useTranslation();
  const [drawnCards, setDrawnCards] = useState<Quote[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const loadQuotes = async () => {
      const lang = i18n.language;
      let loadModule;

      if (lang in quoteModules) {
        loadModule = quoteModules[lang as keyof typeof quoteModules];
      } else if (lang.includes('-')) {
        const baseLang = lang.split('-')[0];
        if (baseLang in quoteModules) {
          loadModule = quoteModules[baseLang as keyof typeof quoteModules];
        }
      }

      if (!loadModule) {
        loadModule = quoteModules.en;
      }

      try {
        const quotesModule = await loadModule();
        setQuotes(quotesModule.default);
      } catch (error) {
        console.error('Error loading quotes:', error);
        const quotesModule = await quoteModules.en();
        setQuotes(quotesModule.default);
      }
    };
    loadQuotes();
  }, [i18n.language]);

  useEffect(() => {
    document.title = t('title') + ' - Your Gentle Guide';
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(true);
    }
  }, [countdown, t]);

  const drawCards = (num: number) => {
    const shuffled = quotes.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, num);
    setDrawnCards(selected);
    setAiResponse('');
  };

  const handleExplainClick = (card: Quote) => {
    setSelectedCard(card);
    const question = prompt(t('question_prompt'));
    if (question) {
      setUserQuestion(question);
      getExplanation(i18n.language);
    }
  };

  const getExplanation = async (lang: string | null) => {
    if (!selectedCard || !userQuestion) {
      console.error('selectedCard or userQuestion is null');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setAiResponse('');

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setAiResponse(t('error_api_key'));
      setIsLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const languageName = lang || 'English';

      const prompt = `Explain the following quote in a warm, gentle, and insightful way, in the context of my question. Please respond in ${languageName}.\n\nQuote: "${selectedCard.quote}"\n\nMy question: "${userQuestion}"\n\nKeep the explanation concise, kind, and easy to understand.`;
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
      setAiResponse(t('error_fetching') + '\n\n' + t('error_details', { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  return (
    <>
      <header className="app-header">
        <h1>{t('title')}</h1>
        {drawnCards.length === 0 && <p>{t('subtitle')}</p>}
        {!showButtons && <p className="countdown">{t('countdown', { count: countdown })}</p>}
      </header>

      {showButtons && drawnCards.length === 0 && (
        <div className="draw-button-container">
          <button className="btn btn-primary" onClick={() => drawCards(1)}>
            {t('draw_card')}
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
            <img src={card.image} className="card-img-top" alt={card.title} />
            <div className="card-body">
              <h5 className="card-title">{card.title}</h5>
              <p className="card-text">{card.quote}</p>
              <button
                className="btn btn-info btn-sm"
                onClick={() => handleExplainClick(card)}
              >
                {t('explain_more')}
              </button>
            </div>
          </div>
        ))}
      </main>

      {drawnCards.length > 0 && (
        <div className="start-over-container">
          <button className="btn btn-secondary" onClick={handleStartOver}>
            {t('start_over')}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>{t('loading')}</p>
        </div>
      )}

      {aiResponse && (
        <section className="ai-response">
          <h3>{t('ai_response_title')}</h3>
          <ReactMarkdown>{aiResponse}</ReactMarkdown>
        </section>
      )}
    </>
  );
}

function App() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Router>
      <div className="app-container">
        <div className="top-bar">
          <div className="how-it-works-switcher">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('home')}
            </NavLink>
            <NavLink to="/how-aura-works" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('how_aura_works')}
            </NavLink>
            <NavLink to="/how-to-ask" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('how_to_ask')}
            </NavLink>
          </div>
          <div className="language-switcher">
            <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>English</button>
            <button onClick={() => changeLanguage('es')} className={i18n.language === 'es' ? 'active' : ''}>Español</button>
            <button onClick={() => changeLanguage('zh-TW')} className={i18n.language === 'zh-TW' ? 'active' : ''}>繁體中文</button>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-aura-works" element={<HowAuraWorks />} />
          <Route path="/how-to-ask" element={<HowToAsk />} />
        </Routes>

        <footer className="app-footer">
          <p>{t('footer_text')}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
