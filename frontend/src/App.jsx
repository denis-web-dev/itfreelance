import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home.jsx';
import CreateAccount from './pages/CreateAccount/CreateAccount.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ProfileEdit from './pages/Profile/ProfileEdit.jsx';
import Privacy from './pages/Privacy/Privacy.jsx';
import Orders from './pages/Orders/Orders.jsx';
import ProfileCabinet from './pages/Profile/ProfileCabinet.jsx';
import DealsTab from './pages/Profile/tabs/DealsTab.jsx';
import AboutTab from './pages/Profile/tabs/AboutTab.jsx';
import ComingSoon from './pages/Profile/tabs/ComingSoon.jsx';

function App() {
	return (
		<div className="app-container">
			<Routes>
				{/* публичные */}
				<Route path="/" element={<Home />} />
				{/* <Route path="/" element={<Navigate to="/create-account" replace />} /> */}
				<Route path="/create-account" element={<CreateAccount />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/reset-password" element={<ResetPassword />} />
				<Route path="/privacy" element={<Privacy />} />

				{/* защищённые */}
				<Route element={<ProtectedRoute />}>
					<Route path="/profile" element={<ProfileCabinet />}>
						<Route index element={<Navigate to="deals" replace />} />
						<Route path="deals" element={<DealsTab />} />
						<Route path="favorites" element={<ComingSoon title="Избранное" />} />
						<Route path="about" element={<AboutTab />} />
						<Route path="settings" element={<ComingSoon title="Настройки" />} />
					</Route>
					<Route path="/profile/edit" element={<ProfileEdit />} />
					<Route path="/profile-edit" element={<Navigate to="/profile/edit" replace />} />
					<Route path="/orders" element={<Orders />} />
				</Route>
			</Routes>
		</div>
	);
}

export default App;
