# How Aura Works

Aura is a web application that provides users with insightful quotes and AI-powered explanations. This document outlines the technical details of how the application functions.

## Core Functionality

1.  **Initial State:** When the app loads, it displays a title, a subtitle, and a countdown timer. After the countdown, a "Draw a Card" button appears.
2.  **Drawing a Card:** When the user clicks the "Draw a Card" button, the app randomly selects a quote from a predefined list and displays it on a card.
3.  **Getting an Explanation:** Each card has an "Explain More" button. When clicked, the user is prompted to ask a question about the card.
4.  **AI-Powered Explanations:** The user's question, along with the quote, is sent to the Google Generative AI (Gemini) model. The model generates an explanation, which is then displayed to the user.
5.  **Starting Over:** The user can click the "Draw Another Card" button to restart the process.

## Technical Details

### Frontend

*   **Framework:** The application is built using [React](https://react.dev/) and [Vite](https://vitejs.dev/).
*   **Main Components:**
    *   `main.tsx`: The entry point of the application. It renders the `App` component.
    *   `App.tsx`: The main component that manages the application's state and logic. It handles drawing cards, user input, and communication with the AI model.
*   **State Management:** The application uses React's `useState` and `useEffect` hooks to manage its state, including the countdown, drawn cards, user questions, and AI responses.

### Internationalization

*   **Library:** The app uses the `i18next` library to handle translations.
*   **Supported Languages:** The app supports English (`en`), Spanish (`es`), and Traditional Chinese (`zh-TW`).
*   **Translation Files:**
    *   UI text is stored in `src/locales/[language]/translation.json`.
    *   Quotes are stored in `src/quotes.[language].json`.

### AI Integration

*   **AI Model:** The application uses the Google Generative AI (Gemini) model to provide explanations for the quotes.
*   **API Key:** To use the AI functionality, you must have a Google Gemini API key. The key should be stored in a `.env` file in the `aura-app` directory with the following format:

    ```
    VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

*   **API Communication:** The `getExplanation` function in `App.tsx` sends a prompt to the Gemini API, which includes the quote, the user's question, and the desired language for the response.

## How to Run the Application

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Set up API Key:** Create a `.env` file in the `aura-app` directory and add your Google Gemini API key as described above.
3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
