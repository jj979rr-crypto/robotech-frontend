// src/pages/internal/StaffSelection.tsx
import { useNavigate, Link } from 'react-router-dom';

// --- ICONOS SVG ---
const IconBuilding = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
);
const IconGavel = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 13.5 2-2.5-2-2.5-2 2.5-2-2.5-2 2.5-2-2.5"/><path d="M14 14 16.5 16.5"/><path d="m11.5 11.5 2.5 2.5"/><path d="m9 9 2.5 2.5"/><path d="m6.5 6.5 2.5 2.5"/><path d="m4 4 2.5 2.5"/><path d="M2 2l20 20"/><path d="M19 19v-6h-6v6h6Z"/></svg> // Versión estilizada de martillo/juez
);
const IconArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const IconUsers = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconScale = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
);

export const StaffSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden">
      
      {/* BACKGROUND (Mismo estilo que Login para coherencia) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-10 text-center mb-16 animate-fade-in-up">
        <div className="inline-block mb-3 px-3 py-1 rounded-full border border-slate-700 bg-slate-900/50 backdrop-blur text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Acceso Privado
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
          ROBOTECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">STAFF</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Seleccione su credencial para acceder al sistema de gestión.
        </p>
      </div>

      {/* CARDS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full relative z-10">
        
        {/* === CARD 1: DUEÑO DE CLUB (AZUL) === */}
        <div className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 overflow-hidden">
          
          {/* Decoración de Fondo */}
          <div className="absolute -right-6 -top-6 text-slate-800 group-hover:text-blue-900/30 transition-colors duration-500 transform group-hover:scale-110">
             <IconBuilding className="w-40 h-40 opacity-20" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>

          {/* Contenido */}
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-all">
                <IconUsers className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Dueño de Club
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
              Administración de equipos, inscripción de robots y gestión de pilotos.
            </p>

            <div className="space-y-4">
                <button 
                    onClick={() => navigate('/internal/login-owner')}
                    className="w-full flex items-center justify-between px-6 py-3 bg-slate-800 hover:bg-blue-600 text-white rounded-lg transition-all group/btn border border-slate-700 hover:border-blue-500"
                >
                    <span className="text-sm font-bold uppercase tracking-wide">Acceder al Portal</span>
                    <IconArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">¿Nuevo equipo?</span>
                    <Link to="/registro-club" className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center gap-1">
                        Registrar Club
                    </Link>
                </div>
            </div>
          </div>
        </div>

        {/* === CARD 2: JUEZ (ROJO) === */}
        <div className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-red-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-1 overflow-hidden">
          
          {/* Decoración de Fondo */}
          <div className="absolute -right-6 -top-6 text-slate-800 group-hover:text-red-900/30 transition-colors duration-500 transform group-hover:scale-110">
             <IconScale className="w-40 h-40 opacity-20" />
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>

          {/* Contenido */}
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-500/30 flex items-center justify-center mb-6 text-red-400 group-hover:text-white group-hover:bg-red-600 transition-all">
                <IconGavel className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              Juez de Torneo
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
              Panel de arbitraje, puntuación en tiempo real y validación de partidas.
            </p>

            <div className="space-y-4">
                <button 
                    onClick={() => navigate('/internal/login-judge')}
                    className="w-full flex items-center justify-between px-6 py-3 bg-slate-800 hover:bg-red-600 text-white rounded-lg transition-all group/btn border border-slate-700 hover:border-red-500"
                >
                    <span className="text-sm font-bold uppercase tracking-wide">Panel de Juez</span>
                    <IconArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">¿Certificación?</span>
                    <Link to="/registro-juez" className="text-red-400 hover:text-red-300 font-medium hover:underline flex items-center gap-1">
                        Aplicar ahora
                    </Link>
                </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* FOOTER */}
      <div className="mt-16 text-center">
        <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase mb-2">
            Robotech System v2.5
        </p>
        <div className="flex justify-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
        </div>
      </div>
    </div>
  );
};