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
  const [showHowAuraWorks, setShowHowAuraWorks] = useState(false);
  const [showHowToAsk, setShowHowToAsk] = useState(false);

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

      const prompt = `Explain the following quote in a warm, gentle, and insightful way, in the context of my question. Please respond in ${languageName}.\n\nQuote: "${selectedCard.quote}"\nCategory: "${selectedCard.category}"\n\nMy question: "${userQuestion}"\n\nKeep the explanation concise, kind, and easy to understand.`;
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
      <div className="top-bar">
        <div className="language-switcher">
          <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>English</button>
          <button onClick={() => changeLanguage('es')} className={i18n.language === 'es' ? 'active' : ''}>Español</button>
          <button onClick={() => changeLanguage('zh-TW')} className={i18n.language === 'zh-TW' ? 'active' : ''}>繁體中文</button>
        </div>
        <div className="how-it-works-switcher">
          <button onClick={() => { setShowHowAuraWorks(true); setShowHowToAsk(false); }} className={showHowAuraWorks ? 'active' : ''}>
            {t('how_aura_works')}
          </button>
          <button onClick={() => { setShowHowToAsk(true); setShowHowAuraWorks(false); }} className={showHowToAsk ? 'active' : ''}>
            {t('how_to_ask')}
          </button>
        </div>
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

      {showHowAuraWorks && (
        <section className="how-aura-works">
          <h2>{t('how_aura_works_title')}</h2>
          <p>{t('how_aura_works_intro')}</p>
          <p>{t('how_aura_works_quantum_intro')}</p>
          <h4>{t('how_aura_works_observer_effect_title')}</h4>
          <p>{t('how_aura_works_observer_effect_text')}</p>
          <h4>{t('how_aura_works_entanglement_title')}</h4>
          <p>{t('how_aura_works_entanglement_text')}</p>
          <p>{t('how_aura_works_conclusion')}</p>
        </section>
      )}

      {showHowToAsk && (
        <section className="how-to-ask">
          <h2>{t('how_to_ask_title')}</h2>
          <p>{t('how_to_ask_intro')}</p>
          <h4>{t('how_to_ask_step1_title')}</h4>
          <p>{t('how_to_ask_step1_text')}</p>
          <h4>{t('how_to_ask_step2_title')}</h4>
          <p>{t('how_to_ask_step2_text')}</p>
          <h4>{t('how_to_ask_step3_title')}</h4>
          <p>{t('how_to_ask_step3_text')}</p>
          <h4>{t('how_to_ask_step4_title')}</h4>
          <p>{t('how_to_ask_step4_text')}</p>
          <h4>{t('how_to_ask_examples_title')}</h4>
          <p>{t('how_to_ask_examples_intro')}</p>
          <ul>
            <li>{t('how_to_ask_example1')}</li>
            <li>{t('how_to_ask_example2')}</li>
            <li>{t('how_to_ask_example3')}</li>
          </ul>
        </section>
      )}

      <footer className="app-footer">
        <p>{t('footer_text')}</p>
      </footer>
    </div>
  );
}

export default App;