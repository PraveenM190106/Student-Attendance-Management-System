import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import './styles/index.css';

export function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
