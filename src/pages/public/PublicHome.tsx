// src/pages/public/PublicHome.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { tournamentService } from '../../services/tournamentService'; // Importar servicio
import type { Tournament } from '../../services/tournamentService'; // Importar tipo
import logoRobotech from '../../assets/logorobotech.png';

// --- ICONOS (Optimizados) ---
const IconMenu = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);
const IconTrophy = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const IconCpu = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
);
const IconArrowRight = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const IconSend = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

export const PublicHome = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
  // Estados para datos reales
  const [realTournaments, setRealTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // 🆕 Función auxiliar para decidir a dónde ir
  const handleDetailsClick = (torneo: Tournament) => {
      const yaEmpezo = new Date(torneo.fechaInicio) <= new Date() || torneo.estado === 'IN_PROGRESS' || torneo.estado === 'FINISHED';

      if (yaEmpezo) {
          navigate(`/torneos/${torneo.id}`); // Ir al Bracket
      } else {
          navigate(`/torneos/${torneo.id}/inscritos`); // Ir a lista
      }
    };

  // Imágenes de fondo
  const heroImages = [
    "https://images.unsplash.com/photo-1558137623-ce933996c730?q=80&w=1106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1655088651367-f9f4e1328f08?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/%D0%94%D1%80%D1%83%D0%B3%D0%B8%D0%B9_%D0%B4%D0%B5%D0%BD%D1%8C_ROBOTICA_2025.jpg/640px-%D0%94%D1%80%D1%83%D0%B3%D0%B8%D0%B9_%D0%B4%D0%B5%D0%BD%D1%8C_ROBOTICA_2025.jpg",
    "https://plus.unsplash.com/premium_photo-1739538279172-9bd4d900e60e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://media.istockphoto.com/id/454234369/photo/robots-playing-hockey.jpg?s=2048x2048&w=is&k=20&c=Rs7U8V_mWj-ecXFIASeruW82YX7BwltldJTGwQuIxiI="
  ];

  // Efecto del Carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Efecto para cargar Torneos Reales
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await tournamentService.getPublicTournaments();
        // Tomamos solo los primeros 3 para la home
        setRealTournaments(data ? data.slice(0, 5) : []);
      } catch (error) {
        console.error("Error cargando torneos públicos", error);
      } finally {
        setLoadingTournaments(false);
      }
    };
    fetchTournaments();
  }, []);

  const newsItems = [
    { id: 1, title: "Nuevo reglamento oficial v2.0", date: "Hace 2 días", tag: "Reglamento" },
    { id: 2, title: "Resultados finales: Copa Invierno", date: "Hace 1 semana", tag: "Torneos" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* LOGO AREA - MODIFICADO */}
          <div className="flex items-center gap-3">
             {/* 2. 👇 USA LA VARIABLE IMPORTADA AQUÍ */}
             <img
               src={logoRobotech}
               alt="Robotech Logo"
               // Ajusté la altura para que se vea bien en móvil (h-8) y escritorio (md:h-10)
               className="h-8 md:h-10 w-auto object-contain"
             />
          </div>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-medium uppercase tracking-wide text-slate-400">
            <a href="#inicio" className="hover:text-blue-400 transition-colors">Inicio</a>
            <a href="#nosotros" className="hover:text-blue-400 transition-colors">Nosotros</a>
            <a href="#torneos" className="hover:text-blue-400 transition-colors">Torneos</a>
            <Link to="/ranking" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              Ranking <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </Link>
            <a href="#noticias" className="hover:text-blue-400 transition-colors">Noticias</a>
            <a href="#galeria" className="hover:text-blue-400 transition-colors">Galería</a>
            <a href="#contacto" className="hover:text-blue-400 transition-colors">Contacto</a>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all"
            >
              Login
            </Link>
            <Link 
              to="/internal"
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105"
            >
              Staff
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <IconMenu />
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
             {['Inicio', 'Nosotros', 'Torneos', 'Noticias', 'Galería', 'Contacto'].map((item) => (
               <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm font-medium text-slate-300 hover:text-blue-400">
                 {item}
               </a>
             ))}
             <Link to="/ranking" className="block text-sm font-medium text-blue-400">Ver Ranking Oficial</Link>
          </div>
        )}
      </header>

      <main className="relative z-10">
        
        {/* HERO SECTION */}
        <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            {heroImages.map((img, index) => (
              <div 
                key={index}
                className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out transform ${index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/60 to-slate-950"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-green-500/30 backdrop-blur-md mb-10 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-green-300 uppercase">Temporada 2025 II Activa</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-15 leading-[1.1] drop-shadow-2xl">
              CONSTRUYE.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                PROGRAMA.
              </span><br />
              COMPITE.
            </h1>

            <p className="text-slate-200 text-base md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-lg font-medium">
              La liga definitiva de robótica competitiva. Inscribete, sube en el ranking nacional y demuestra tu ingenio en la arena.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link 
                to="/registro"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-sm tracking-wide hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 transform hover:-translate-y-1"
              >
                Inscribir Competidor
              </Link>
              <Link 
                to="/ranking"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/20 text-white font-bold text-sm tracking-wide hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2"
              >
                Ver Ranking Live
              </Link>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroImages.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </section>

        {/* STATS HUD */}
        <section className="relative z-20 -mt-10 mb-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
              {[
                { label: "Robots Activos", value: "124", color: "text-blue-400" },
                { label: "Clubes Registrados", value: "18", color: "text-purple-400" },
                { label: "Torneos Oficiales", value: "05", color: "text-emerald-400" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-2 border-b md:border-b-0 md:border-r border-slate-700/50 last:border-0">
                  <span className={`text-5xl font-black ${stat.color} font-mono tracking-tighter`}>{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-2">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NOSOTROS */}
        <section id="nosotros" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <IconCpu className="text-blue-500 w-8 h-8" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Misión & Visión</span>
              </h2>
              <div className="space-y-6 text-slate-400 text-sm leading-7">
                <p>
                  <strong className="text-slate-200">Robotech</strong> nace con el propósito de estandarizar y profesionalizar la robótica competitiva. No somos solo un ranking; somos el ecosistema donde estudiantes y profesionales ponen a prueba sus diseños.
                </p>
                <p>
                  Utilizamos un stack tecnológico de vanguardia para garantizar transparencia total en los puntajes y fixtures en tiempo real.
                </p>
                <Link to="/registro-club" className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mt-4 hover:text-blue-300 border-b border-blue-400/30 pb-1">
                  ¿Tienes un equipo? Regístralo aquí <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="relative h-72 w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.15),transparent)]" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-40 h-40 border border-dashed border-slate-700 rounded-full animate-[spin_20s_linear_infinite]" />
                 <div className="absolute w-28 h-28 border border-blue-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                 <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
               </div>
               <div className="absolute bottom-4 left-4 font-mono text-[10px] text-blue-500/50">
                 SYSTEM_STATUS: <span className="text-emerald-500">ONLINE</span>
               </div>
            </div>
          </div>
        </section>

        {/* TORNEOS & NOTICIAS GRID (CON DATA REAL) */}
        <section id="torneos" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 bg-slate-900/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Columna Torneos (2/3) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">Próximos Torneos</h3>
                <Link to="/torneos" className="text-xs font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400">Ver calendario completo →</Link>
              </div>
              
              <div className="space-y-4">
                {loadingTournaments ? (
                  <div className="text-center py-10 text-slate-500 text-sm animate-pulse">Cargando eventos...</div>
                ) : !Array.isArray(realTournaments) || realTournaments.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    No hay torneos públicos activos en este momento.
                  </div>
                ) : (
                  realTournaments.map((t) => {
                    // Lógica para estado visual
                    const isOpen = new Date(t.fechaInicio) > new Date();
                    const yaEmpezo = new Date(t.fechaInicio) <= new Date() || t.estado === 'IN_PROGRESS' || t.estado === 'FINISHED';
                    const statusText = isOpen ? 'Inscripciones Abiertas' : 'En Curso';
                    const statusColor = isOpen ? 'text-emerald-400 bg-emerald-900/20' : 'text-amber-400 bg-amber-900/20';
                    // Manejo seguro de la categoría
                    const catName = typeof t.categoria === 'string' ? t.categoria : (t.categoria as any)?.name || 'General';

                    return (
                      <div key={t.id} className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-900/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                                {catName}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                📅 {new Date(t.fechaInicio).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{t.nombre}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${statusColor}`}>
                              {statusText}
                            </span>
                            {/* 👇 BOTÓN MODIFICADO PARA USAR TU LÓGICA INTELIGENTE 👇 */}

                            <button 
                                  onClick={() => handleDetailsClick(t)} 
                                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition-colors border border-slate-700 cursor-pointer">
                                  {yaEmpezo ? 'Ver Torneo' : 'Ver Inscritos'}
                                </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Columna Noticias / Sidebar (1/3) */}
            <div id="noticias" className="lg:col-span-1">
              <h3 className="text-2xl font-bold text-white mb-8">Últimas Noticias</h3>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
                {newsItems.map((news) => (
                  <div key={news.id} className="group border-b border-slate-800 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-mono text-blue-400">#{news.tag}</p>
                      <p className="text-[10px] text-slate-600">{news.date}</p>
                    </div>
                    <h5 className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors cursor-pointer leading-snug">{news.title}</h5>
                  </div>
                ))}
                <button className="w-full mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 rounded-lg py-3 transition-colors">
                  Ver archivo
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* RANKING PREVIEW (Teaser) */}
        <section className="bg-slate-950 py-24 border-y border-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Ranking Nacional</h2>
            <p className="text-slate-400 text-sm mb-12">Actualizado en tiempo real tras cada combate oficial.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Segundo Lugar */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-t-2xl border-t-4 border-slate-600 relative hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl font-black text-slate-700 mb-2 opacity-50">2</div>
                <div className="font-bold text-white text-lg">IronBot</div>
                <div className="text-xs text-slate-500 font-mono mt-1">97 Puntos</div>
              </div>
              
              {/* Primer Lugar */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-slate-800 to-slate-950 p-10 rounded-t-2xl border-t-4 border-yellow-500 shadow-[0_-10px_40px_rgba(234,179,8,0.15)] relative z-10 hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 p-3 rounded-full shadow-lg border-4 border-slate-950">
                  <IconTrophy className="w-6 h-6" />
                </div>
                <div className="text-5xl font-black text-yellow-500/20 mb-2">1</div>
                <div className="text-2xl font-black text-white">LAL0BA</div>
                <div className="text-sm font-mono text-yellow-500 mt-1 font-bold">120 Puntos</div>
                <div className="mt-4 px-3 py-1 bg-yellow-500/10 rounded text-[10px] text-yellow-200 inline-block border border-yellow-500/20">CAMPEÓN VIGENTE</div>
              </div>

              {/* Tercer Lugar */}
              <div className="order-3 md:order-3 bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-t-2xl border-t-4 border-amber-800 relative hover:-translate-y-2 transition-transform duration-300">
                 <div className="text-4xl font-black text-slate-800 mb-2 opacity-50">3</div>
                <div className="font-bold text-white text-lg">Runner</div>
                <div className="text-xs text-slate-500 font-mono mt-1">80 Puntos</div>
              </div>
            </div>
            
            <Link to="/ranking" className="inline-block mt-12 px-8 py-3 rounded-full bg-slate-900 border border-slate-700 text-white font-semibold text-sm hover:bg-blue-600 hover:border-blue-500 transition-all">
              Ver Tabla Completa
            </Link>
          </div>
        </section>

        {/* GALERIA SIMPLE */}
        <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Galería de Encuentros</h2>
            <p className="text-slate-400 text-sm mt-3">Los mejores momentos de la ingeniería en acción.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96">
            <div className="h-full bg-slate-800 rounded-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-transparent transition-colors duration-500"></div>
              <img src="https://images.unsplash.com/photo-1563206767-5b1d972e811b?auto=format&fit=crop&q=80" alt="Robot" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"/>
            </div>
            <div className="h-full bg-slate-800 rounded-2xl overflow-hidden md:col-span-2 relative group">
               <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors duration-500"></div>
               <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80" alt="Arena" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"/>
               <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all">Final Regional '24</div>
            </div>
            <div className="h-full bg-slate-800 rounded-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-purple-900/20 group-hover:bg-transparent transition-colors duration-500"></div>
              <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80" alt="Tech" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"/>
            </div>
          </div>
        </section>

        {/* CONTACT FORM SECTION */}
        <section id="contacto" className="max-w-4xl mx-auto px-4 mb-32 pt-10">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* Info Side */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 md:w-2/5 flex flex-col justify-between text-white">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contáctanos</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  ¿Tienes dudas sobre las categorías o el reglamento? Envíanos un mensaje y el equipo técnico te responderá.
                </p>
                <div className="space-y-4 text-sm font-medium text-blue-50">
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 p-2 rounded-lg">📧</span>
                    contacto@robotechleague.com
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 p-2 rounded-lg">📍</span>
                    Sede Central, TechHub
                  </div>
                </div>
              </div>
              <div className="mt-10 md:mt-0">
                <p className="text-xs text-blue-200 uppercase tracking-widest">Powered by React</p>
              </div>
            </div>

            {/* Form Side */}
            <div className="p-10 md:w-3/5 bg-slate-900">
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Mock de envío
                  const formData = new FormData(e.currentTarget);
                  const subject = formData.get('subject');
                  const body = formData.get('message');
                  window.location.href = `mailto:contacto@robotechleague.com?subject=${subject}&body=${body}`;
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                    <input type="text" name="name" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Tu nombre" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                    <input type="email" name="email" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="usuario@mail.com" required />
                  </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Asunto</label>
                    <select name="subject" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition">
                      <option>Duda sobre Reglamento</option>
                      <option>Problemas con Registro</option>
                      <option>Propuesta de Patrocinio</option>
                      <option>Otro</option>
                    </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Mensaje</label>
                  <textarea name="message" rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none" placeholder="Escribe tu mensaje aquí..." required></textarea>
                </div>

                <button type="submit" className="w-full bg-white text-blue-900 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2">
                  Enviar Mensaje <IconSend className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs mb-3">
            © 2025 Robotech League. Sistema Oficial de Torneos.
          </p>
          <div className="flex justify-center gap-6 text-[10px] text-slate-600 uppercase tracking-widest font-medium">
            <a href="#" className="hover:text-blue-500 transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Reglamento Oficial</a>
          </div>
        </div>
      </footer>
    </div>
  );
};