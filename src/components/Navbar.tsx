import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { employee, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          to={isAdmin ? '/admin' : '/evaluaciones'}
          className="text-sm font-semibold text-surface-800 tracking-tight"
        >
          Evaluación de Desempeño
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-surface-100 text-surface-800'
                    : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
                }`}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              to="/evaluaciones"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/evaluaciones')
                  ? 'bg-surface-100 text-surface-800'
                  : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
              }`}
            >
              Mis Evaluaciones
            </Link>
          )}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-surface-800 leading-tight">
              {employee?.name}
            </p>
            <p className="text-[11px] text-surface-400 leading-tight capitalize">
              {employee?.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>

          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary-600">
              {employee?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
