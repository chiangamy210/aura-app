import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";
import HowAuraWorks from "./HowAuraWorks";
import HowToAsk from "./HowToAsk";
import "./App.css";

interface Quote {
  title: string;
  quote: string;
  image: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini API Key being used:", API_KEY); // Added for debugging
const genAI = new GoogleGenerativeAI(API_KEY);

const quoteModules = {
  en: () => import("./quotes.en.json"),
  es: () => import("./quotes.es.json"),
  "zh-TW": () => import("./quotes.zh-TW.json"),
};

function Home() {
  const { t, i18n } = useTranslation();
  const [drawnCardIndices, setDrawnCardIndices] = useState<number[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [revealedCard, setRevealedCard] = useState<number | null>(null);
  const [selectedFanCard, setSelectedFanCard] = useState<number | null>(null);

  const [tappedCard, setTappedCard] = useState<number | null>(null);

  const [showSubtitle, setShowSubtitle] = useState(true);

  // Define the number of cards to display in the fan
  const fanCardsCount = 53;
  const [fanCardIndices, setFanCardIndices] = useState<number[]>([]);

  useEffect(() => {
    const loadQuotes = async () => {
      const lang = i18n.language;
      let loadModule;

      if (lang in quoteModules) {
        loadModule = quoteModules[lang as keyof typeof quoteModules];
      } else if (lang.includes("-")) {
        const baseLang = lang.split("-")[0];
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
        // Set up the initial fan of cards
        const shuffledIndices = Array.from(quotesModule.default.keys()).sort(
          () => 0.5 - Math.random()
        );
        setFanCardIndices(shuffledIndices.slice(0, fanCardsCount));
      } catch (error) {
        console.error("Error loading quotes:", error);
        const quotesModule = await quoteModules.en();
        setQuotes(quotesModule.default);
      }
    };
    loadQuotes();
  }, [i18n.language]);

  const [fanVisible, setFanVisible] = useState(false);

  useEffect(() => {
    if (showButtons) {
      // Use a timeout to allow the component to mount before adding the visible class
      const timer = setTimeout(() => setFanVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showButtons]);

  useEffect(() => {
    document.title = t("title") + " - Your Gentle Guide";
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(true);
      setShowSubtitle(false); // Hide subtitle when countdown finishes
    }
  }, [countdown, t]);

  useEffect(() => {
    if (selectedCard && userQuestion) {
      getExplanation(i18n.language);
    }
  }, [i18n.language, selectedCard, userQuestion]);

  const handleCardSelect = (cardIndex: number) => {
    setSelectedFanCard(cardIndex);
    setAiResponse("");

    // Animate out the selected card
    setTimeout(() => {
      setDrawnCardIndices([cardIndex]);
      setRevealedCard(cardIndex);
    }, 1000); // Match animation duration
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExplainClick = (card: Quote) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (question: string) => {
    setUserQuestion(question);
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getExplanation = async (lang: string | null) => {
    if (!selectedCard || !userQuestion) {
      console.error("selectedCard or userQuestion is null");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setAiResponse("");

    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      setAiResponse(t("error_api_key"));
      setIsLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
      });
      const languageName = lang || "English";

      const prompt = `Your response MUST be in ${languageName}. You are "Aura," a warm, wise, and insightful digital guide. Your purpose is to help a user who has come to you feeling confused, upset, or seeking clarity. They have just drawn a card from a symbolic deck and have asked a question.\n\nYour response must be professional, warm, insightful, and helpful. You are not a fortune teller who predicts the future. You are a gentle guide who uses the symbolism of the card to offer perspective, encourage reflection, and empower the user to find their own answers.\n\nUser and Card Information:\n\nUser's Question: "${userQuestion}"\n\nCard Drawn: "${selectedCard.title}"\n\nCard's Visual Description: "${selectedCard.quote}" (Note: Using the quote as a placeholder for visual description since actual image descriptions are not available.)\n\nYour Response Must Follow This Exact Structure, without explicitly stating the section titles (e.g., do not write "Introduce the Card:"):\n\n1.  Begin by warmly and empathetically acknowledging the user's situation without being specific. Use phrases like "Thank you for sharing what's on your mind," or "It's brave to seek clarity when things feel uncertain."\n2.  State the name of the card they have drawn.\n3.  Interpret the card's meaning using its message. Connect the quote to abstract concepts.\n4.  Gently bridge the card's message to the user's specific question. Frame it as an invitation to see their situation from a new perspective.\n5.  Provide a reflective question or a small, gentle action for the user to ponder or take. This should empower them.\n6.  End with a short, warm, and empowering statement.\n\nCrucial Rules to Follow:\n\nDO NOT predict the future. Never say "you will" or "this is going to happen."\n\nDO NOT give direct advice (e.g., "You should break up with him," "You should quit your job").\n\nDO NOT provide medical, legal, or financial advice.\n\nDO maintain a warm, professional, and almost poetic tone.\n\nDO keep the response concise and focused, around 20-55 sentences in total.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setAiResponse(text);
    } catch (error) {
      console.error("Error getting explanation:", error);
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setAiResponse(
        t("error_fetching") +
          "\n\n" +
          t("error_details", { error: errorMessage })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  const getCardFanStyles = (index: number) => {
    const cardsCount = fanCardIndices.length;
    const angle = (345 / cardsCount) * index;
    const radius = 25; // in vmin
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    const rotationAngle = angle + 90;

    const transform = `translateX(-50%) translateY(-50%) translate(${x}vmin, ${y}vmin) rotate(${rotationAngle}deg)`;
    const centerTransform = `translateX(-50%) translateY(-50%) translate(0, 0) scale(1.2) rotate(0deg)`;

    return {
      transform,
      zIndex: index,
      ["--center-transform" as string]: centerTransform,
    };
  };

  const handleTap = (cardIndex: number) => {
    if (tappedCard === cardIndex) {
      // Second tap
      handleCardSelect(cardIndex);
      setTappedCard(null);
    } else {
      // First tap
      setTappedCard(cardIndex);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, cardIndex: number) => {
    e.preventDefault();
    handleTap(cardIndex);
  };

  return (
    <>
      <header className="app-header">
        {showSubtitle && <p>{t("subtitle")}</p>}
        {!showButtons && (
          <p className="countdown">{t("countdown", { count: countdown })}</p>
        )}
      </header>

      {showButtons && revealedCard === null && (
        <div className="choose-card-container">
          <p>{t("choose_card")}</p>
        </div>
      )}

      <main className="card-container">
        {revealedCard !== null
          ? drawnCardIndices.map((cardIndex) => {
              const card = quotes[cardIndex];
              if (!card) return null;
              return (
                <div className={`card revealed`} key={cardIndex}>
                  <img
                    src={card.image}
                    className="card-img-top"
                    alt={card.title}
                    loading="lazy"
                  />
                  <div className="card-body">
                    <h5 className="card-title">{card.title}</h5>
                    <p className="card-text">{card.quote}</p>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleExplainClick(card)}
                    >
                      {t("explain_more")}
                    </button>
                  </div>
                </div>
              );
            })
          : showButtons && (
              <div className={`card-fan ${fanVisible ? "visible" : ""}`}>
                {fanCardIndices.map((cardIndex, index) => (
                  <div
                    key={cardIndex}
                    className={`card ${
                      selectedFanCard === cardIndex ? "selected" : ""
                    } ${tappedCard === cardIndex ? "tapped" : ""}`}
                    style={getCardFanStyles(index)}
                    onClick={() => handleTap(cardIndex)}
                    onTouchEnd={(e) => handleTouchEnd(e, cardIndex)}
                  >
                    <div className="card-inner">
                      <div className="card-front">
                        <img
                          src="/img/back.png"
                          alt="Card Back"
                          style={{ width: "100%", borderRadius: "10px" }}
                        />
                      </div>
                      <div className="card-back">
                        <img
                          src={quotes[cardIndex]?.image}
                          alt={quotes[cardIndex]?.title}
                          style={{ width: "100%", borderRadius: "10px" }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </main>

      {revealedCard !== null && (
        <div className="start-over-container">
          <button className="btn btn-secondary" onClick={handleStartOver}>
            {t("start_over")}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>{t("loading")}</p>
        </div>
      )}

      {aiResponse && (
        <section className="ai-response">
          <h3>{t("ai_response_title")}</h3>
          <ReactMarkdown>{aiResponse}</ReactMarkdown>
        </section>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t("question_prompt")}</h3>
            <textarea id="question-input" rows={4} />
            <div className="modal-buttons">
              <button
                className="submit-btn"
                onClick={() =>
                  handleModalSubmit(
                    (
                      document.getElementById(
                        "question-input"
                      ) as HTMLTextAreaElement
                    ).value
                  )
                }
              >
                Submit
              </button>
              <button className="cancel-btn" onClick={handleModalClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
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
          <Link to="/" className="app-title-link">
            <h1 className="app-title">{t("title")}</h1>
          </Link>
          <div className="how-it-works-switcher">
            <NavLink
              to="/how-aura-works"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {t("how_aura_works")}
            </NavLink>
            <NavLink
              to="/how-to-ask"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {t("how_to_ask")}
            </NavLink>
          </div>
          <div className="language-switcher">
            <button
              onClick={() => changeLanguage("en")}
              className={i18n.language === "en" ? "active" : ""}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage("es")}
              className={i18n.language === "es" ? "active" : ""}
            >
              Español
            </button>
            <button
              onClick={() => changeLanguage("zh-TW")}
              className={i18n.language === "zh-TW" ? "active" : ""}
            >
              繁體中文
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-aura-works" element={<HowAuraWorks />} />
          <Route path="/how-to-ask" element={<HowToAsk />} />
        </Routes>

        <footer className="app-footer">
          <p>{t("footer_text")}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
