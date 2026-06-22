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
    <>
      {/* Mobile Top Navbar */}
      <nav className="md:hidden print:hidden bg-primary-500 text-white h-14 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link
          to={isAdmin ? '/admin' : '/evaluaciones'}
          className="text-sm font-semibold tracking-tight text-white"
        >
          Central de Negocios
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">
              {employee?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-white/80 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex print:hidden fixed inset-y-0 left-0 w-64 bg-primary-500 text-white flex-col border-r border-primary-600/30 z-50 p-6">
        {/* Brand */}
        <div className="mb-10">
          <Link
            to={isAdmin ? '/admin' : '/evaluaciones'}
            className="text-lg font-bold tracking-tight text-white block"
          >
            Central de Negocios
          </Link>
          <p className="text-[10px] text-white/50 tracking-wider uppercase mt-1">Evaluación de Desempeño</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/admin' || location.pathname.startsWith('/admin/reporte')
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard Admin
            </Link>
          )}
          <Link
            to="/evaluaciones"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              isActive('/evaluaciones') || isActive('/evaluar')
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Mis Evaluaciones
          </Link>
        </nav>

        {/* User Info & Logout Footer */}
        <div className="border-t border-primary-600/30 pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-white">
                {employee?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {employee?.name}
              </p>
              <p className="text-[10px] text-white/70 capitalize truncate leading-tight mt-0.5">
                {employee?.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-all text-left"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
