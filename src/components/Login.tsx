import { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Login = ({ onClose }: { onClose: () => void }) => {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError(null);
      onClose();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Login to Save</h3>
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
        <button className="cancel-btn" onClick={onClose}>Cancel</button>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
