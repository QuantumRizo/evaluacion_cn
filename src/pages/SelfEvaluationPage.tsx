import { Link } from 'react-router-dom';

export default function SelfEvaluationPage() {
  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center bg-white border border-surface-200 p-8 rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-800 mb-3">Autoevaluación</h1>
        <p className="text-surface-400 text-sm leading-relaxed mb-6 font-normal">
          Esta sección estará disponible próximamente. Aquí podrás evaluar tu propio desempeño
          en las diferentes categorías definidas.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-900 text-white transition-colors duration-200 text-xs font-semibold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
