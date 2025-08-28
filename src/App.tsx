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
import HowAuraWorks from "./components/HowAuraWorks";
import HowToAsk from "./components/HowToAsk";
import Login from "./components/Login";
import SavedCards from "./components/SavedCards";
import { auth, saveCard } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/animations.css";

interface Quote {
  title: string;
  quote: string;
  image: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const quoteModules = {
  en: () => import("./quotes.en.json"),
  es: () => import("./quotes.es.json"),
  "zh-TW": () => import("./quotes.zh-TW.json"),
};

function Home({
  handleSaveCard,
  isCardSaved,
  resetCardSaved,
}: {
  handleSaveCard: any;
  isCardSaved: boolean;
  resetCardSaved: any;
}) {
  const { t, i18n } = useTranslation();
  const [drawnCardIndices, setDrawnCardIndices] = useState<number[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [countdown, setCountdown] = useState(1);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [revealedCard, setRevealedCard] = useState<number | null>(null);
  const [selectedFanCard, setSelectedFanCard] = useState<number | null>(null);

  const [tappedCard, setTappedCard] = useState<number | null>(null);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [preloadingCard, setPreloadingCard] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState(new Set<number>());

  const [showSubtitle, setShowSubtitle] = useState(false);

  // Define the number of cards to display in the fan
  const fanCardsCount = 53;
  const [fanCardIndices, setFanCardIndices] = useState<number[]>([]);

  useEffect(() => {
    // This effect runs only once to set up the initial fan of cards.
    const indices = Array.from({ length: fanCardsCount }, (_, i) => i);
    const shuffledIndices = indices.sort(() => 0.5 - Math.random());
    setFanCardIndices(shuffledIndices.slice(0, fanCardsCount));
  }, []); // Empty dependency array ensures this runs only once.

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
    if (isStart && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setShowButtons(true);
      setShowSubtitle(false); // Hide subtitle when countdown finishes
    }
  }, [isStart, countdown, t]);

  useEffect(() => {
    if (selectedCard && userQuestion) {
      getExplanation(i18n.language);
    }
  }, [i18n.language, selectedCard, userQuestion]);

  useEffect(() => {
    if (revealedCard !== null) {
      resetCardSaved();
    }
  }, [revealedCard]);

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

      const prompt = `Your response MUST be in ${languageName}. You are "Aura," a warm, wise, and insightful digital guide. Your purpose is to help a user who has come to you feeling confused, upset, or seeking clarity. They have just drawn a card from a symbolic deck and have asked a question.\n\nYour response must be professional, warm, insightful, and helpful. You are not a fortune teller who predicts the future. You are a gentle guide who uses the symbolism of the card to offer perspective, encourage reflection, and empower the user to find their own answers.\n\nUser and Card Information:\n\nUser's Question: "${userQuestion}"\n\nCard Drawn: "${selectedCard.title}"\n\nCard's Visual Description: "${selectedCard.quote}" (Note: Using the quote as a placeholder for visual description since actual image descriptions are not available.)\n\nYour Response Must Follow This Exact Structure, without explicitly stating the section titles (e.g., do not write "Introduce the Card:"):\n\n1.  Begin by warmly and empathetically acknowledging the user's situation without being specific. Use phrases like "Thank you for sharing what's on your mind," or "It's brave to seek clarity when things feel uncertain."\n2.  State the name of the card they have drawn.\n3.  Interpret the card's meaning using its message. Connect the quote to abstract concepts.\n4.  Gently bridge the card's message to the user's specific question. Frame it as an invitation to see their situation from a new perspective.\n5.  Provide a reflective question or a small, gentle action for the user to ponder or take. This should empower them.\n6.  End with a short, warm, and empowering statement.\n\nCrucial Rules to Follow:\n\nDO NOT predict the future. Never say "you will" or "this is going to happen."\n\nDO NOT give direct advice (e.g., "You should break up with him," "You should quit your job").\n\nDO NOT provide medical, legal, or financial advice.\n\nDO maintain a warm, professional, and almost poetic tone.\n\nDO ke... [truncated]`;
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
    // Reset all state to initial drawing sequence
    setIsStart(true);
    setShowSubtitle(true);
    setCountdown(10);
    setShowButtons(false);
    setRevealedCard(null);
    setSelectedCard(null);
    setDrawnCardIndices([]);
    setUserQuestion("");
    setAiResponse("");
    setIsLoading(false);
    setSelectedFanCard(null);
    setTappedCard(null);
    setFlippedCard(null);
    resetCardSaved();

    // Reshuffle cards
    const indices = Array.from({ length: fanCardsCount }, (_, i) => i);
    const shuffledIndices = indices.sort(() => 0.5 - Math.random());
    setFanCardIndices(shuffledIndices.slice(0, fanCardsCount));
    setFanVisible(false); // Hide fan before it reappears
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
      if (loadedImages.has(cardIndex)) {
        // Image is already loaded, flip immediately
        setFlippedCard(cardIndex);
        handleCardSelect(cardIndex);
        setTappedCard(null);
      } else {
        // Image is not loaded yet, show spinner and wait
        setPreloadingCard(cardIndex);
      }
    } else {
      // First tap
      setTappedCard(cardIndex);
      // Preload the image in the background
      if (!loadedImages.has(cardIndex)) {
        const img = new Image();
        img.src = quotes[cardIndex].image;
        img.onload = () => {
          setLoadedImages(new Set(loadedImages).add(cardIndex));
          // If the user is still waiting on this card, flip it now
          if (preloadingCard === cardIndex) {
            setFlippedCard(cardIndex);
            handleCardSelect(cardIndex);
            setTappedCard(null);
            setPreloadingCard(null);
          }
        };
        img.onerror = () => {
          console.error("Image failed to load:", img.src);
          setPreloadingCard(null); // Stop showing spinner on error
        };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, cardIndex: number) => {
    e.preventDefault();
    handleTap(cardIndex);
  };

  return (
    <>
      <header className="app-header">
        {!isStart && (
          <div className="introduction-container">
            <div id="introduction">
              <p>{t("introduction")}</p>
            </div>
            <button
              className="btn btn-primary start-button"
              onClick={() => setIsStart(true)}
            >
              {t("start_button")}
            </button>
          </div>
        )}
        {isStart && (
          <>
            {showSubtitle && <p>{t("subtitle")}</p>}
            {!showButtons && (
              <p className="countdown">
                {t("countdown", { count: countdown })}
              </p>
            )}
          </>
        )}
      </header>

      {showButtons && revealedCard === null && (
        <div className="choose-card-container">
          <p>{t("choose_card")}</p>
        </div>
      )}

      <main className="main-content">
        {revealedCard !== null
          ? drawnCardIndices.map((cardIndex) => {
              const card = quotes[cardIndex];
              if (!card) return null;
              return (
                <div className={`card revealed`} key={cardIndex}>
                  <img
                    src={card.image}
                    className="card-img-top"
                    alt={`Aura guidance card: ${card.title}`}
                    loading="eager"
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
                    <button
                      id="save-card-button"
                      className={`btn ${
                        isCardSaved ? "btn-saved" : "btn-success"
                      } btn-sm`}
                      onClick={(e) =>
                        handleSaveCard(card, cardIndex, aiResponse, e)
                      }
                      disabled={isCardSaved}
                    >
                      {isCardSaved ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-bookmark-check-fill"
                            viewBox="0 0 16 16"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"
                            />
                          </svg>
                          <span style={{ marginLeft: "8px" }}>
                            {t("card_saved")}
                          </span>
                        </>
                      ) : (
                        t("save_card")
                      )}
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
                    } ${tappedCard === cardIndex ? "tapped" : ""} ${
                      preloadingCard === cardIndex ? "preloading" : ""
                    }`}
                    style={getCardFanStyles(index)}
                    onClick={() => handleTap(cardIndex)}
                    onTouchEnd={(e) => handleTouchEnd(e, cardIndex)}
                  >
                    <div className="card-inner">
                      {preloadingCard === cardIndex && (
                        <div className="spinner-overlay">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                      <div className="card-front">
                        <img
                          src="/img/back-min.png"
                          alt="The back of a mysterious Aura card, waiting to be revealed."
                          style={{ width: "100%", borderRadius: "10px" }}
                        />
                      </div>
                      <div className="card-back">
                        <img
                          src={quotes[cardIndex]?.image}
                          alt={
                            quotes[cardIndex]
                              ? `Aura guidance card: ${quotes[cardIndex].title}`
                              : "Aura guidance card"
                          }
                          style={{
                            width: "100%",
                            borderRadius: "10px",
                            opacity: flippedCard === cardIndex ? 1 : 0,
                            transition: "opacity 0.3s ease-in-out",
                          }}
                          loading="lazy" // Changed to eager as we are preloading
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
        <div className="loading-overlay">
          <div className="loading-indicator">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>{t("loading")}</p>
          </div>
        </div>
      )}

      {!isLoading && aiResponse && (
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSaveNotice, setShowSaveNotice] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  const resetCardSaved = () => {
    setIsCardSaved(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsLoginModalOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showSaveNotice) {
      const timer = setTimeout(() => {
        setShowSaveNotice(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaveNotice]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleSignOut = () => {
    auth.signOut();
    setIsUserMenuOpen(false);
  };

  const handleSaveCard = (
    card: Quote,
    cardIndex: number,
    aiResponse: string
  ) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      const cardToSave = {
        ...card,
        id: cardIndex.toString(),
        time: new Date().toISOString(),
        ai_reply: aiResponse,
      };
      saveCard(user.uid, cardToSave);
      setShowSaveNotice(true);
      setIsCardSaved(true);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <div className="top-bar">
          <div className="top-bar-left">
            <Link to="/" className="app-title-link">
              <h1 className="app-title">Aura</h1>
            </Link>
          </div>
          <div className="top-bar-center">
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
              <NavLink
                to="/saved-cards"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {t("saved_cards")}
              </NavLink>
            </div>
          </div>
          <div className="top-bar-right">
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
            <div className="user-actions">
              {user ? (
                <div className="user-menu-container">
                  <button
                    className="user-menu-trigger"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{user.email}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="user-menu">
                      <button onClick={handleSignOut}>Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="login-btn"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <Home
                handleSaveCard={handleSaveCard}
                isCardSaved={isCardSaved}
                resetCardSaved={resetCardSaved}
              />
            }
          />
          <Route path="/how-aura-works" element={<HowAuraWorks />} />
          <Route path="/how-to-ask" element={<HowToAsk />} />
          <Route path="/saved-cards" element={<SavedCards />} />
        </Routes>

        {isLoginModalOpen && (
          <Login onClose={() => setIsLoginModalOpen(false)} />
        )}

        <div className={`save-notification ${showSaveNotice ? "show" : ""}`}>
          {t("card_saved_notice")}
        </div>

        <footer className="app-footer">
          <p>{t("footer_text")}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
