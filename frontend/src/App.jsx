import { Routes, Route, Navigate } from 'react-router-dom';
import CreateAccount from './pages/CreateAccount/CreateAccount.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ProfileEdit from './pages/Profile/ProfileEdit.jsx';
import Privacy from './pages/Privacy/Privacy.jsx';
import Orders from './pages/Orders/Orders.jsx';

function App() {
	return (
		<div className="app-container">
			{' '}
			<Routes>
				<Route path="/" element={<Navigate to="/create-account" replace />} />
				<Route path="/create-account" element={<CreateAccount />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/reset-password" element={<ResetPassword />} />
				<Route path="/profile-edit" element={<ProfileEdit />} />
				<Route path="/orders" element={<Orders />} />
				<Route path="/privacy" element={<Privacy />} />
				<Route element={<ProtectedRoute />} />
			</Routes>
		</div>
	);
}

export default App;
