// src/pages/public/RegisterCompetitor.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authService } from '../../services/authService';

// --- ICONOS SVG (Estilo Cyber) ---
const IconUser = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconIdCard = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="6" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M12 10h4"/><path d="M12 14h4"/></svg>
);
const IconLock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconCode = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);
const IconArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconMail = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);

// 🔹 Helper para calcular edad (Lógica intacta)
const calcularEdad = (fechaNacimiento: string) => {
  const birth = new Date(fechaNacimiento);
  const today = new Date();

  if (isNaN(birth.getTime())) return NaN;

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const RegisterCompetitor = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
  });

  const [loading, setLoading] = useState(false);
  const [searchingDni, setSearchingDni] = useState(false);
  const [reniecLocked, setReniecLocked] = useState(true); // Estado de bloqueo RENIEC

  const dniValue = watch('dni');
  const passwordValue = watch('password', '');

  // Reglas de contraseña para feedback visual
  const passwordRequirements = [
    { id: 1, label: '8+ Caracteres', valid: passwordValue.length >= 8 },
    { id: 2, label: 'Mayúscula', valid: /[A-Z]/.test(passwordValue) },
    { id: 3, label: 'Minúscula', valid: /[a-z]/.test(passwordValue) },
    { id: 4, label: 'Número', valid: /[0-9]/.test(passwordValue) },
    { id: 5, label: 'Símbolo', valid: /[\W_]/.test(passwordValue) },
  ];

  // Lógica de RENIEC (Intacta)
  const onBlurDni = async () => {
    if (dniValue && dniValue.length === 8) {
      setSearchingDni(true);
      try {
        const res = await authService.consultarReniec(dniValue);

        if (res.success && res.data) {
          // RENIEC encontró: autocompletamos y BLOQUEAMOS campos
          setValue('nombres', res.data.nombres);
          setValue('apellidos', res.data.apellidos);
          setReniecLocked(true);

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            background: '#1e293b', // Dark theme toast
            color: '#fff'
          });
          Toast.fire({ icon: 'success', title: 'Identidad Verificada' });
        } else {
          // RENIEC no encontró -> desbloquear para edición manual
          setReniecLocked(false);
          setValue('nombres', '');
          setValue('apellidos', '');

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500,
            background: '#1e293b',
            color: '#fff'
          });
          Toast.fire({ icon: 'warning', title: 'Ingreso Manual Habilitado', text: 'DNI no encontrado en la base de datos.' });
        }
      } catch (error) {
        console.error(error);
        // Error de red -> permitir edición manual
        setReniecLocked(false);
        setValue('nombres', '');
        setValue('apellidos', '');
      } finally {
        setSearchingDni(false);
      }
    }
  };

  const onSubmit = async (data: any) => {
    // Regla 1: mayor de edad
    const edad = calcularEdad(data.fechaNacimiento);
    if (isNaN(edad) || edad < 18) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Debes ser mayor de edad para registrarte como competidor.',
        icon: 'warning',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Regla 2: contraseña ≠ DNI
    if (data.password === data.dni) {
      Swal.fire({
        title: 'Seguridad Baja',
        text: 'La contraseña no puede ser igual a tu DNI.',
        icon: 'warning',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setLoading(true);
    try {
      await authService.registerCompetitor(data);

      // Tu SweetAlert personalizado con el Robot (Intacto)
      Swal.fire({
        background: '#0f172a', // Slate-900 background
        color: '#fff',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <svg width="140" height="170" viewBox="0 0 140 170" xmlns="http://www.w3.org/2000/svg">
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 0; 0 4; 0 0" dur="2.2s" repeatCount="indefinite" />
                <ellipse cx="70" cy="160" rx="26" ry="6" fill="rgba(255,255,255,0.2)">
                  <animate attributeName="rx" values="22;26;22" dur="2.2s" repeatCount="indefinite" />
                </ellipse>
                <rect x="30" y="15" width="80" height="60" rx="10" fill="#3b82f6"/>
                <line x1="70" y1="8" x2="70" y2="15" stroke="#60a5fa" stroke-width="3" />
                <circle cx="70" cy="8" r="4" fill="#fbbf24">
                  <animate attributeName="r" values="4;6;4" dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="fill" values="#fbbf24;#f59e0b;#fbbf24" dur="0.9s" repeatCount="indefinite" />
                </circle>
                <g>
                  <circle cx="50" cy="38" r="8" fill="#dbeafe"/>
                  <circle cx="90" cy="38" r="8" fill="#dbeafe"/>
                  <circle cx="50" cy="38" r="3" fill="#1e293b"/>
                  <circle cx="90" cy="38" r="3" fill="#1e293b"/>
                  <rect x="42" y="34" width="16" height="0" fill="#3b82f6">
                    <animate attributeName="height" values="0;0;8;0;0" dur="4s" repeatCount="indefinite" />
                  </rect>
                  <rect x="82" y="34" width="16" height="0" fill="#3b82f6">
                    <animate attributeName="height" values="0;0;8;0;0" dur="4s" repeatCount="indefinite" />
                  </rect>
                </g>
                <rect x="48" y="52" width="44" height="8" rx="4" fill="#93c5fd">
                  <animate attributeName="width" values="44;36;44" dur="1.8s" repeatCount="indefinite" />
                </rect>
                <rect x="25" y="75" width="90" height="70" rx="12" fill="#1e293b"/>
                <rect x="40" y="87" width="60" height="30" rx="6" fill="#0f172a"/>
                <circle cx="52" cy="102" r="4" fill="#f97316"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" /></circle>
                <circle cx="70" cy="102" r="4" fill="#22c55e"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0.3s" /></circle>
                <circle cx="88" cy="102" r="4" fill="#e5e7eb"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.6s" /></circle>
                <rect x="45" y="145" width="16" height="15" rx="3" fill="#334155"/>
                <rect x="79" y="145" width="16" height="15" rx="3" fill="#334155"/>
                <rect x="40" y="158" width="26" height="5" rx="2" fill="#64748b"/>
                <rect x="74" y="158" width="26" height="5" rx="2" fill="#64748b"/>
              </g>
            </svg>
            <h2 class="text-2xl font-bold text-white mb-1">¡Bienvenido Piloto!</h2>
            <p class="text-sm text-slate-300 text-center">Tu registro ha sido procesado correctamente.</p>
            <div class="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 mt-2">
                <p class="text-xs text-slate-400">
                    Tu perfil está <strong>pendiente de aprobación</strong> por parte del Club.
                </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Iniciar Misión',
        confirmButtonColor: '#3b82f6',
        showClass: { popup: 'animate__animated animate__fadeInUp' }
      }).then(() => {
        navigate('/login');
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error en el registro';
      Swal.fire({
        title: 'Error de Sistema',
        text: Array.isArray(msg) ? msg[0] : msg,
        icon: 'error',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans py-12 px-4 sm:px-6 relative overflow-hidden">
      
      {/* BACKGROUND (Grid Técnico) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                Inscripción de Pilotos
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                Únete a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Liga</span>
            </h1>
            <p className="text-slate-400 text-sm">Crea tu perfil de competidor y gestiona tu flota de robots.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* CARD 1: IDENTIFICACIÓN (DNI, RENIEC) */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shadow-blue-500/10 shadow-lg"><IconIdCard className="w-5 h-5"/></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Identificación Personal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DNI */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">DNI</label>
                        <div className="relative group">
                            <input
                                {...register('dni', { required: 'Requerido', minLength: 8, maxLength: 8, pattern: /^[0-9]+$/ })}
                                maxLength={8} type="text" onBlur={onBlurDni}
                                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 8); }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-700 font-mono tracking-wider shadow-inner"
                                placeholder="00000000"
                            />
                            {searchingDni && (
                                <div className="absolute right-3 top-3.5 flex items-center gap-2 pointer-events-none">
                                    <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
                                    <span className="text-[10px] text-blue-400 font-bold tracking-widest">VERIFICANDO...</span>
                                </div>
                            )}
                        </div>
                        {errors.dni && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.dni?.message as string}</span>}
                    </div>

                    {/* Nombres (Locked by RENIEC) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nombres</label>
                        <input
                            {...register('nombres', { required: 'Requerido' })}
                            readOnly={reniecLocked}
                            className={`w-full border rounded-lg px-4 py-3 text-white outline-none transition-all placeholder-slate-700 ${reniecLocked ? 'bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-950 border-slate-700 focus:border-blue-500'}`}
                            placeholder="Nombres"
                        />
                    </div>

                    {/* Apellidos (Locked by RENIEC) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Apellidos</label>
                        <input
                            {...register('apellidos', { required: 'Requerido' })}
                            readOnly={reniecLocked}
                            className={`w-full border rounded-lg px-4 py-3 text-white outline-none transition-all placeholder-slate-700 ${reniecLocked ? 'bg-slate-900/50 border-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-950 border-slate-700 focus:border-blue-500'}`}
                            placeholder="Apellidos"
                        />
                    </div>

                    {/* Nacimiento */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Fecha de Nacimiento</label>
                        <input
                            {...register('fechaNacimiento', { required: 'Requerido' })}
                            type="date"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all [color-scheme:dark]"
                        />
                        {errors.fechaNacimiento && <span className="text-red-400 text-xs mt-1 ml-1 block">Fecha inválida</span>}
                    </div>
                </div>
            </div>

            {/* CARD 2: PERFIL & CÓDIGO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Perfil */}
                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-800">
                        <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400"><IconUser className="w-4 h-4"/></div>
                        <h3 className="text-sm font-bold text-white">Perfil de Piloto</h3>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nickname</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-slate-500 font-bold">@</span>
                            <input
                                {...register('nickname', { required: true, minLength: 3, maxLength: 20, pattern: /^[A-Za-z0-9_-]+$/ })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700 font-bold"
                                placeholder="TheDestroyer"
                            />
                        </div>
                        {errors.nickname && <span className="text-red-400 text-xs mt-1 ml-1 block">Usuario inválido</span>}
                    </div>
                </div>

                {/* Código de Invitación */}
                <div className="bg-blue-900/10 backdrop-blur border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-blue-500/20">
                            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><IconCode className="w-4 h-4"/></div>
                            <h3 className="text-sm font-bold text-blue-100">Invitación de Club</h3>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-400/70 uppercase mb-2 ml-1">Código de Acceso</label>
                            <input
                                {...register('codigoInvitacion', { required: 'Requerido' })}
                                className="w-full bg-slate-950 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 outline-none transition-all placeholder-slate-700 text-center font-mono tracking-widest uppercase shadow-inner"
                                placeholder="CLUB-XXXX"
                            />
                            {errors.codigoInvitacion && <span className="text-red-400 text-xs mt-1 ml-1 block text-center">Código requerido</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: CREDENCIALES */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><IconLock className="w-5 h-5"/></div>
                    <h3 className="text-lg font-bold text-white">Seguridad de Cuenta</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconMail className="w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors"/>
                            </div>
                            <input
                                {...register('email', { required: true, pattern: /.+@.+\..+/ })}
                                type="email"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none transition-all placeholder-slate-700"
                                placeholder="piloto@email.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Contraseña</label>
                        <input
                            {...register('password', { required: true, validate: (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(val) })}
                            type="password"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all placeholder-slate-700"
                            placeholder="••••••••"
                        />
                        {/* Visual Password Strength (Pills) */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {passwordRequirements.map((req) => (
                                <span key={req.id} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${req.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                    {req.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800/50">
                <Link to="/login" className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors group">
                    <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-3`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Procesando...
                        </>
                    ) : 'Confirmar Registro'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};