// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { authService } from '../../services/authService';

// --- ICONOS & ASSETS ---

// 🤖 EL ROBOT PERUANO V2.0 (Con módulo de parpadeo corregido)
const PeruvianTechBot = () => (
  <div className="relative w-36 h-36 mx-auto mb-6 animate-[float_6s_ease-in-out_infinite]">
    {/* Estilos locales para la animación de parpadeo específica */}
    <style>{`
      @keyframes blink {
        0%, 48%, 52%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(0.1); }
      }
      .eye-blink {
        animation: blink 4s infinite;
        transform-box: fill-box;
        transform-origin: center;
      }
    `}</style>

    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
      
      {/* Definiciones de gradientes */}
      <defs>
        <linearGradient id="peru-jersey" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="30%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#D91023" /> {/* Rojo Perú */}
          <stop offset="70%" stopColor="#D91023" />
          <stop offset="70%" stopColor="#ffffff" />
        </linearGradient>
        
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        
        <linearGradient id="screen-glare" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4"/>
           <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* --- CUERPO --- */}
      
      {/* Antena (con luz roja parpadeante) */}
      <line x1="100" y1="40" x2="100" y2="15" stroke="#64748b" strokeWidth="3" />
      <circle cx="100" cy="15" r="6" fill="#ef4444" className="animate-pulse shadow-lg shadow-red-500" />

      {/* Cabeza */}
      <rect x="50" y="40" width="100" height="60" rx="12" fill="url(#metal)" stroke="#334155" strokeWidth="2" />
      
      {/* Pantalla Negra de los ojos */}
      <rect x="60" y="55" width="80" height="30" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      
      {/* OJOS QUE PARPADEAN (Clase .eye-blink) */}
      <g fill="#06b6d4"> {/* Color Cyan Neon */}
          {/* Ojo Izquierdo */}
          <circle cx="85" cy="70" r="8" className="eye-blink" />
          {/* Ojo Derecho (Con un retraso mínimo para parecer orgánico) */}
          <circle cx="115" cy="70" r="8" className="eye-blink" style={{ animationDelay: '0.1s' }} />
      </g>
      
      {/* Reflejo en la pantalla (Detalle de vidrio) */}
      <path d="M 65 60 L 90 60 L 80 80 Z" fill="url(#screen-glare)" opacity="0.3" />

      {/* Torso Camiseta Perú */}
      <path d="M 40 110 Q 40 190 100 195 Q 160 190 160 110 L 160 100 L 40 100 Z" fill="url(#peru-jersey)" stroke="#cbd5e1" strokeWidth="2" />

      {/* Brazos Flotantes */}
      <path d="M 30 120 Q 10 140 30 160" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 170 120 Q 190 140 170 160" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" fill="none" />
      
      {/* Laptop Holográfica */}
      <g transform="translate(135, 145) rotate(-10)">
         <rect width="40" height="28" rx="3" fill="#2563eb" fillOpacity="0.8" stroke="#60a5fa" />
         <rect x="5" y="5" width="30" height="18" fill="#1e3a8a" />
         {/* Líneas de código en pantalla */}
         <line x1="8" y1="10" x2="25" y2="10" stroke="#4ade80" strokeWidth="2" />
         <line x1="8" y1="16" x2="20" y2="16" stroke="#4ade80" strokeWidth="2" />
      </g>

    </svg>
    
    {/* Mensaje flotante */}
    <div className="absolute -right-10 -top-2 bg-white/90 backdrop-blur text-slate-900 text-[10px] font-bold py-1 px-3 rounded-full shadow-lg animate-bounce border border-slate-200 z-20">
      ¡Ingresa Tus Datos!
      <div className="absolute bottom-0 left-0 -mb-1 ml-2 w-2 h-2 bg-white transform rotate-45"></div>
    </div>
  </div>
);

// Iconos de Interfaz
const IconMail = ({ className }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconLock = ({ className }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconEye = ({ className }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff = ({ className }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>);
const IconArrowLeft = ({ className }: { className?: string }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);

interface LoginProps {
  title: string;
  role: string;
  color: 'blue' | 'red' | 'slate';
}

export const LoginPage = ({ title, role: requiredRole, color }: LoginProps) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [resendSeconds, setResendSeconds] = useState(120);

  // --- CONFIGURACIÓN DE TEMA VISUAL ---
  const themeStyles = {
    blue: {
      primary: 'text-blue-500',
      ring: 'focus-within:ring-blue-500',
      border: 'focus-within:border-blue-500',
      btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
      gradient: 'from-blue-600 to-cyan-500'
    },
    red: {
      primary: 'text-red-500',
      ring: 'focus-within:ring-red-500',
      border: 'focus-within:border-red-500',
      btn: 'bg-red-600 hover:bg-red-500 shadow-red-500/20',
      gradient: 'from-red-600 to-orange-500'
    },
    slate: {
      primary: 'text-slate-400',
      ring: 'focus-within:ring-slate-400',
      border: 'focus-within:border-slate-400',
      btn: 'bg-slate-700 hover:bg-slate-600 shadow-slate-500/20',
      gradient: 'from-slate-600 to-gray-500'
    },
  };
  const theme = themeStyles[color];

  // --- LÓGICA DE NEGOCIO (INTACTA) ---
  const getRegisterLink = () => {
    switch (requiredRole) {
      case 'competitor': return { text: '¿Nuevo en la liga?', linkText: 'Crear cuenta de piloto', path: '/registro' };
      case 'club_owner': return { text: '¿Lideras un equipo?', linkText: 'Registrar Club', path: '/registro-club' };
      case 'judge': return { text: '¿Personal oficial?', linkText: 'Acreditación de Juez', path: '/registro-juez' };
      default: return null;
    }
  };
  const registerData = getRegisterLink();

  const checkPermissions = (userRole: string, userStaffType?: string) => {
    if (requiredRole === 'admin') return userRole === 'admin';
    if (requiredRole === 'competitor') return userRole === 'competitor';
    if (requiredRole === 'club_owner') return userRole === 'staff' && userStaffType === 'club_owner';
    if (requiredRole === 'judge') return userRole === 'staff' && userStaffType === 'judge';
    return false;
  };

  useEffect(() => {
    if (!show2FA || resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [show2FA, resendSeconds]);

  const formatSeconds = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      if (!show2FA) {
        const response = await authService.login(formData.email, formData.password);
        const roleToCheck = response.user ? response.user.role : response.role;
        const staffTypeToCheck = response.user ? response.user.staffType : response.staffType;

        if (!checkPermissions(roleToCheck, staffTypeToCheck)) {
          throw new Error(`PERMISO DENEGADO: Credenciales inválidas para acceso ${title}.`);
        }

        if (response.require2fa) {
          setTempUserId(response.userId || '');
          setShow2FA(true);
          setResendSeconds(120);
          Swal.fire({ 
            icon: 'info', 
            title: 'Protocolo de Seguridad', 
            text: 'Verificación de dos pasos requerida. Código enviado.',
            background: '#1e293b', 
            color: '#fff' 
          });
        } else if (response.access_token) {
          loginSuccess(response);
        }
      } else {
        const response = await authService.verify2fa(tempUserId, formData.code);
        if (response.access_token) loginSuccess(response);
      }
    } catch (error: any) {
      const msg = error.message?.includes('PERMISO DENEGADO') ? error.message : error.response?.data?.message || 'Error de autenticación';
      Swal.fire({ 
        icon: 'error', 
        title: 'Acceso Bloqueado', 
        text: Array.isArray(msg) ? msg[0] : msg,
        background: '#1e293b', 
        color: '#fff' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginSuccess = (response: any) => {
    localStorage.setItem('access_token', response.access_token);
    if (response.user) localStorage.setItem('user', JSON.stringify(response.user));
    
    if (requiredRole === 'admin') navigate('/admin/dashboard');
    else if (requiredRole === 'club_owner') navigate('/club/dashboard');
    else if (requiredRole === 'judge') navigate('/juez/dashboard');
    else navigate('/perfil');
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0 || !tempUserId) return;
    setIsLoading(true);
    try {
      await authService.resend2fa(tempUserId);
      setResendSeconds(120);
      Swal.fire({ icon: 'success', title: 'Código reenviado', timer: 2000, background: '#1e293b', color: '#fff' });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo al reenviar.', background: '#1e293b', color: '#fff' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (show2FA) {
      setShow2FA(false);
      setTempUserId('');
    } else {
      navigate(requiredRole === 'competitor' ? '/' : '/internal');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* 1. BACKGROUND LAYER (Tecnológico Abstracto - No Torneos) */}
      <div className="absolute inset-0 z-0">
         {/* Imagen: Data Center Abstracto / Redes Neurales */}
         <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }} 
        ></div>
        {/* Capa oscura para legibilidad */}
        <div className="absolute inset-0 bg-slate-950/80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/90 to-slate-950"></div>
        {/* Grid animado sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* 2. MAIN CARD */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        
        {/* 🤖 ROBOT PERUANO ANIMADO */}
        <PeruvianTechBot />

        {/* TARJETA GLASSMORPHISM */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative group">
          
          {/* Luz de borde superior */}
          <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${theme.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
          
          <div className="p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
               <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                 {show2FA ? 'Verificación 2FA' : title}
               </h2>
               <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                 {show2FA ? 'Código de acceso seguro' : 'Identificación requerida'}
               </p>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {!show2FA ? (
                <>
                  {/* Email Input */}
                  <div className={`relative bg-slate-950/50 border border-slate-700 rounded-lg group transition-all duration-300 ${theme.border} focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconMail className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      {...register('email', { required: 'Email requerido' })}
                      type="email"
                      className="block w-full pl-10 pr-3 py-3 bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0"
                      placeholder="ID de Piloto / Email"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="text-red-400 text-[10px] ml-1">{errors.email.message as string}</span>}

                  {/* Password Input */}
                  <div className={`relative bg-slate-950/50 border border-slate-700 rounded-lg group transition-all duration-300 ${theme.border} focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconLock className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      {...register('password', { required: 'Contraseña requerida' })}
                      type={showPassword ? "text" : "password"}
                      className="block w-full pl-10 pr-10 py-3 bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0"
                      placeholder="••••••••"
                    />
                    <div 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-500 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                    </div>
                  </div>
                  {errors.password && <span className="text-red-400 text-[10px] ml-1">{errors.password.message as string}</span>}

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-white transition-colors hover:underline decoration-slate-500">
                      Recuperar contraseña
                    </Link>
                  </div>
                </>
              ) : (
                /* 2FA Input Style "Matrix" */
                <div className="space-y-4 animate-fade-in">
                    <div className={`relative bg-black/40 border border-slate-600 rounded-lg overflow-hidden ${theme.border} ${theme.ring}`}>
                        <input
                            {...register('code', { required: true, minLength: 6, maxLength: 6 })}
                            type="text"
                            maxLength={6}
                            autoFocus
                            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 6); }}
                            className="block w-full py-4 text-center text-3xl font-mono tracking-[0.5em] bg-transparent text-white placeholder-slate-700 focus:outline-none"
                            placeholder="000000"
                        />
                        {/* Overlay effect */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent h-1/2"></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 px-1">
                        <span>Código de seguridad</span>
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isLoading || resendSeconds > 0}
                            className={`font-medium ${resendSeconds > 0 ? 'opacity-50' : 'text-blue-400 hover:text-blue-300'}`}
                        >
                            {resendSeconds > 0 ? `Reenviar en ${formatSeconds(resendSeconds)}` : 'Reenviar ahora'}
                        </button>
                    </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${theme.btn}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Autenticando...
                  </span>
                ) : (
                  show2FA ? 'Confirmar Enlace' : 'Iniciar Sistema'
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-4">
               {!show2FA && registerData && (
                 <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">{registerData.text}</p>
                    <Link to={registerData.path} className={`text-sm font-bold ${theme.primary} hover:text-white transition-colors`}>
                        {registerData.linkText} →
                    </Link>
                 </div>
               )}
               
               {requiredRole !== 'admin' && (
                  <button onClick={handleBack} className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      <IconArrowLeft className="w-3 h-3" />
                      {show2FA ? 'Cancelar verificación' : 'Regresar a Home'}
                  </button>
               )}
            </div>

          </div>
        </div>
        
        {/* Footer Legal */}
        <div className="mt-6 text-center opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-mono text-slate-500">
                SECURE CONNECTION // ENCRYPTED v2.0
            </p>
        </div>

      </div>
    </div>
  );
};