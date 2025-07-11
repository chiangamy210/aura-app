import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

interface Quote {
  category: string;
  quote: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const quoteModules = {
  en: () => import('./quotes.en.json'),
  es: () => import('./quotes.es.json'),
  'zh-TW': () => import('./quotes.zh-TW.json'),
};

function App() {
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
      getExplanation(card, question, i18n.language);
    }
  };

  const getExplanation = async (card: Quote, question: string, lang: string | null) => {
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

      const prompt = `Explain the following quote in a warm, gentle, and insightful way, in the context of my question. Please respond in ${languageName}.\n\nQuote: "${card.quote}"\nCategory: "${card.category}"\n\nMy question: "${question}"\n\nKeep the explanation concise, kind, and easy to understand.`;
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="app-container">
      <div className="language-switcher">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('es')}>Español</button>
        <button onClick={() => changeLanguage('zh-TW')}>繁體中文</button>
      </div>
      <header className="app-header">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
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
            <div className="card-body">
              <h5 className="card-title">{card.category}</h5>
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
    </div>
  );
}

export default App;