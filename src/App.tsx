import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DeveloperView from './components/DeveloperView';
import UserView from './components/UserView';
import TelemetryDashboard from './components/TelemetryDashboard';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<DeveloperView />} />
        <Route path="/execute" element={<UserView />} />
        <Route path="/telemetry" element={<TelemetryDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;