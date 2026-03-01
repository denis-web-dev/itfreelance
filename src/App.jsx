import { Routes, Route, Navigate } from 'react-router-dom';
import CreateAccount from './pages/CreateAccount/CreateAccount.jsx';
import Login from './pages/Login/Login.jsx';

function App() {
  return (
    <div className="app-container">
      {' '}
      <Routes>
        <Route path="/" element={<Navigate to="/create-account" replace />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
