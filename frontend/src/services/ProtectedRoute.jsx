import { Navigate, Outlet } from 'react-router-dom';

function NavigateToDefaultRoute({ role }) {
  switch (role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'officer':
      return <Navigate to="/officer/dashboard" replace />;
    case 'validator':
      return <Navigate to="/validator/dashboard" replace />;
    case 'society':
      return <Navigate to="/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  
  if (!token || !userString) {
    return <Navigate to="/" replace />;
  }

  let user;
  try {
    user = JSON.parse(userString);
  } catch (error) {
    console.log(error)
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles) {
    return <Outlet />;
  }
  
  if (allowedRoles.includes(user.role)) {
    return <Outlet />;
  }
  
  return <NavigateToDefaultRoute role={user.role} />;
}