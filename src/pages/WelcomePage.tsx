import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const categories = [
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    label: 'Orientación a Resultados',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    label: 'Pensamiento Estratégico',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    label: 'Liderazgo',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    label: 'Trabajo en Equipo',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: 'Comunicación',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: 'Innovación',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
      </svg>
    ),
    label: 'Adaptabilidad',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Ética Profesional',
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col justify-between py-12 px-6">
      {/* Container */}
      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-center">
        {/* Header */}
        <header className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-surface-200 text-surface-500 text-xs font-medium mb-5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Acceso Corporativo
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-surface-800 mb-4">
            Central de Negocios
          </h1>

          <p className="text-surface-400 text-base md:text-lg max-w-xl mx-auto font-normal">
            Portal de Evaluación de Desempeño Corporativo. Selecciona una de las modalidades a continuación para iniciar.
          </p>
        </header>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full mb-16">
          {/* Self-Evaluation Card */}
          <button
            onClick={() => navigate('/autoevaluacion')}
            onMouseEnter={() => setHoveredCard('self')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative p-8 rounded-2xl border border-surface-200 bg-white text-left transition-all duration-300 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-surface-100 flex items-center justify-center mb-6 group-hover:bg-primary-50 transition-colors duration-300">
                <svg className="w-5 h-5 text-surface-600 group-hover:text-primary-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-surface-800 mb-2">
                Autoevaluación
              </h2>
              <p className="text-surface-500 text-sm leading-relaxed mb-6 font-normal">
                Reflexiona sobre tu propio progreso en el ciclo actual. Analiza tus fortalezas y objetivos profesionales.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-primary-500 font-medium text-sm">
              <span>Iniciar autoevaluación</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${hoveredCard === 'self' ? 'translate-x-0.5' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Peer Evaluation Card */}
          <button
            onClick={() => navigate('/evaluar')}
            onMouseEnter={() => setHoveredCard('peer')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative p-8 rounded-2xl border border-surface-200 bg-white text-left transition-all duration-300 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-surface-100 flex items-center justify-center mb-6 group-hover:bg-primary-50 transition-colors duration-300">
                <svg className="w-5 h-5 text-surface-600 group-hover:text-primary-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-surface-800 mb-2">
                Evaluación a Terceros
              </h2>
              <p className="text-surface-500 text-sm leading-relaxed mb-6 font-normal">
                Evalúa el desempeño de tus compañeros y líderes de manera completamente confidencial.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-primary-500 font-medium text-sm">
              <span>Evaluar a un colaborador</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${hoveredCard === 'peer' ? 'translate-x-0.5' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Competencies Section */}
        <section className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8 border-t border-surface-200 pt-10">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-surface-400 mb-1.5">
              Criterios de Evaluación
            </h3>
            <p className="text-surface-500 text-xs font-normal">
              Competencias clave medidas en cada evaluación
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-surface-200 bg-white"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                  {cat.icon}
                </div>
                <span className="text-[13px] font-medium text-surface-700 leading-tight">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full text-center mt-12">
        <div className="inline-flex items-center gap-1.5 text-surface-400 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Garantía de Privacidad: Todas las respuestas son recopiladas de forma confidencial.
        </div>
      </footer>
    </div>
  );
}
