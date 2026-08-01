import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { warmUpBackend } from './services/api';
import './styles/index.css';

export function App() {
  useEffect(() => {
    warmUpBackend();
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
