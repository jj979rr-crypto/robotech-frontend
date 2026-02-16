// src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';



// --- ICONOS SVG ---
const IconMail = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconLock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconKey = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
);
const IconCheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconInfo = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

type Step = 'REQUEST' | 'VERIFY_CODE' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  
  const [step, setStep] = useState<Step>('REQUEST');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Variables persistentes
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [code, setCode] = useState(''); 

  // --- LÓGICA DE MANEJO DE PASOS ---

  const handleRequestCode = async (data: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await authService.requestPasswordReset(data.email);
      setCurrentEmail(data.email);
      setCurrentUserId(response.userId);
      setStep('VERIFY_CODE');
      reset();
    } catch (error: any) {
      setErrorMsg(error.message || 'No se pudo enviar el correo. Verifique el email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.verifyResetCode(currentUserId, code);
      setStep('RESET_PASSWORD');
    } catch (error: any) {
      setErrorMsg(error.message || 'El código es incorrecto o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      return setErrorMsg('Las contraseñas no coinciden.');
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.resetPasswordOnApp(currentUserId, data.password);
      setStep('SUCCESS');
    } catch (error: any) {
      setErrorMsg(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = () => {
    switch(step) {
      case 'REQUEST': return 1;
      case 'VERIFY_CODE': return 2;
      case 'RESET_PASSWORD': return 3;
      case 'SUCCESS': return 4;
    }
  };
  const currentStepIndex = getStepIndex();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-950 font-sans text-slate-200 overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 blur-sm"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop')" }} 
        ></div>
        <div className="absolute inset-0 bg-slate-950/80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/90 to-slate-950"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-4 animate-fade-in-up">
        
        {/* CARD GLASSMORPHISM */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden relative">
            
            {/* Progress Bar Superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStepIndex / 4) * 100}%` }}
                ></div>
            </div>

            <div className="p-8 sm:p-10">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
                       {step === 'REQUEST' && <IconMail className="w-6 h-6 text-blue-400" />}
                       {step === 'VERIFY_CODE' && <IconKey className="w-6 h-6 text-purple-400" />}
                       {step === 'RESET_PASSWORD' && <IconLock className="w-6 h-6 text-emerald-400" />}
                       {step === 'SUCCESS' && <IconCheckCircle className="w-6 h-6 text-green-400" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Recuperación de Acceso
                    </h2>
                    <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-widest">
                        {step === 'REQUEST' && 'Paso 1/3: Identificación'}
                        {step === 'VERIFY_CODE' && 'Paso 2/3: Verificación'}
                        {step === 'RESET_PASSWORD' && 'Paso 3/3: Seguridad'}
                        {step === 'SUCCESS' && 'Proceso Completado'}
                    </p>
                </div>

                {/* ERROR ALERT */}
                {errorMsg && (
                    <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-500 rounded text-red-200 text-xs flex items-center gap-2 animate-shake">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {errorMsg}
                    </div>
                )}

                {/* --- CONTENIDO POR PASO --- */}
                
                {step === 'REQUEST' && (
                    <form className="space-y-6" onSubmit={handleSubmit(handleRequestCode)}>
                        <div className="group relative bg-slate-950/50 border border-slate-700 rounded-lg transition-all focus-within:border-blue-500 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconMail className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                {...register('email', { 
                                    required: "El correo es obligatorio",
                                    pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: "Formato inválido" }
                                })}
                                type="email"
                                className="block w-full pl-10 pr-3 py-3 bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0 focus:outline-none"
                                placeholder="Correo electrónico registrado"
                            />
                        </div>
                        {errors.email && <span className="text-red-400 text-[10px] ml-1 block">{errors.email.message as string}</span>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando Señal...' : 'Enviar Código'}
                        </button>
                    </form>
                )}

                {step === 'VERIFY_CODE' && (
                    <form onSubmit={handleVerifyCode} className="space-y-6 animate-fade-in">
                        <div className="text-center bg-blue-900/20 border border-blue-900/50 rounded-lg p-3">
                            <p className="text-xs text-blue-200">
                                Hemos enviado un código de 6 dígitos a:
                                <br/>
                                <span className="font-mono font-bold text-white">{currentEmail}</span>
                            </p>
                        </div>
                        
                        <div className="relative bg-slate-950/80 border border-slate-600 rounded-lg overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className="block w-full py-4 text-center text-3xl font-mono tracking-[0.5em] bg-transparent text-white placeholder-slate-700 focus:outline-none border-none"
                                placeholder="000000"
                                autoFocus
                            />
                             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent h-1/2"></div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Confirmar Código'}
                        </button>
                        
                        <div className="text-center">
                            <button type="button" onClick={() => setStep('REQUEST')} className="text-xs text-slate-500 hover:text-white underline">
                                ¿No recibiste el código? Intentar de nuevo
                            </button>
                        </div>
                    </form>
                )}

                {/* PASO 3: VALIDACIÓN ESTRICTA AGREGADA AQUÍ */}
                {step === 'RESET_PASSWORD' && (
                    <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-5 animate-fade-in">
                        
                        {/* Info de requisitos */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex gap-2">
                             <IconInfo className="w-5 h-5 text-blue-400 flex-shrink-0" />
                             <p className="text-[10px] text-slate-400 leading-tight">
                                La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un símbolo especial.
                             </p>
                        </div>

                        <div className="group relative bg-slate-950/50 border border-slate-700 rounded-lg transition-all focus-within:border-emerald-500 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconLock className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                {...register('password', { 
                                    required: "Contraseña requerida", 
                                    minLength: { value: 8, message: "Mínimo 8 caracteres" },
                                    // 🔒 AQUÍ ESTÁ LA VALIDACIÓN ESTRICTA
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                                        message: "Debe contener Mayúscula, Minúscula, Número y Símbolo."
                                    }
                                })}
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0 focus:outline-none"
                                placeholder="Nueva Contraseña Fuerte"
                            />
                        </div>
                        {errors.password && <span className="text-red-400 text-[10px] ml-1 block">{errors.password.message as string}</span>}

                        <div className="group relative bg-slate-950/50 border border-slate-700 rounded-lg transition-all focus-within:border-emerald-500 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconLock className="h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                {...register('confirmPassword', { 
                                    required: "Confirmación requerida",
                                    validate: (value) => value === watch('password') || "Las contraseñas no coinciden"
                                })}
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0 focus:outline-none"
                                placeholder="Confirmar Contraseña"
                            />
                        </div>
                        {errors.confirmPassword && <span className="text-red-400 text-[10px] ml-1 block">{errors.confirmPassword.message as string}</span>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Actualizando...' : 'Establecer Contraseña'}
                        </button>
                    </form>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center py-4 animate-fade-in-up">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <IconCheckCircle className="h-10 w-10 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">¡Acceso Restaurado!</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Tu contraseña ha sido actualizada en el sistema central. Ya puedes autenticarte con tus nuevas credenciales.
                        </p>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-slate-900 bg-white hover:bg-slate-200 transition-colors shadow-lg"
                        >
                            Ir al Login
                        </button>
                    </div>
                )}

                {/* Footer Cancel Link */}
                <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                    {step !== 'SUCCESS' && (
                        <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors group">
                            <IconArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            Cancelar operación
                        </Link>
                    )}
                </div>
            </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
             SYSTEM RECOVERY // V1.0
        </p>

      </div>
    </div>
  );
};