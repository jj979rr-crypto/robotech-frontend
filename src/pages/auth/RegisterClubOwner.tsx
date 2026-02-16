// src/pages/internal/RegisterClubOwner.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Swal from 'sweetalert2';

// --- ICONOS SVG (Estilo Cyber-Industrial) ---
const IconBuilding = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
);
const IconUser = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconLock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

// 🔹 Helper para calcular edad (INTACTO)
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

export const RegisterClubOwner = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  const [searchingDni, setSearchingDni] = useState(false);

  const dniValue = watch('dni');
  const passwordValue = watch('password', '');

  // Reglas de contraseña visuales
  const passwordRequirements = [
    { id: 1, label: '8+ Caracteres', valid: passwordValue.length >= 8 },
    { id: 2, label: 'Mayúscula', valid: /[A-Z]/.test(passwordValue) },
    { id: 3, label: 'Minúscula', valid: /[a-z]/.test(passwordValue) },
    { id: 4, label: 'Número', valid: /[0-9]/.test(passwordValue) },
    { id: 5, label: 'Símbolo', valid: /[\W_]/.test(passwordValue) },
  ];

  // 🔹 Autocompletar con RENIEC (INTACTO)
  const onBlurDni = async () => {
    const dni = (dniValue || '').trim();
    if (!dni || dni.length !== 8) return;

    setSearchingDni(true);
    try {
      const res = await authService.consultarReniec(dni);

      const nombres = res?.data?.nombres;
      const apellidos = res?.data?.apellidos;

      // Detectamos el fallback de "CIUDADANO GENÉRICO"
      const esGenerico =
        typeof nombres === 'string' &&
        typeof apellidos === 'string' &&
        nombres.toUpperCase() === 'CIUDADANO' &&
        apellidos.toUpperCase().includes('GENÉRICO');

      if (res.success && res.data && !esGenerico) {
        // Encontrado en RENIEC
        setValue('nombres', nombres || '');
        setValue('apellidos', apellidos || '');

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            background: '#1e293b', // Dark Toast
            color: '#fff'
        });
        Toast.fire({ icon: 'success', title: 'Identidad Verificada' });
      } else {
        // No encontrado / genérico
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
        Toast.fire({ icon: 'warning', title: 'DNI no encontrado', text: 'Ingresa los datos manualmente' });
      }
    } catch (error) {
      console.error('Error consultando RENIEC:', error);
      setValue('nombres', '');
      setValue('apellidos', '');
    } finally {
      setSearchingDni(false);
    }
  };

  const onSubmit = async (data: any) => {
    setErrorAlert({ show: false, message: '' });

    // Regla 1: mayor de edad
    const edad = calcularEdad(data.fechaNacimiento);
    if (isNaN(edad) || edad < 18) {
      setErrorAlert({
        show: true,
        message: 'El representante del club debe ser mayor de edad (18+).',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 🔒 Regla 2: contraseña ≠ DNI
    if (data.password === data.dni) {
      setErrorAlert({
        show: true,
        message: 'La contraseña no puede ser igual al DNI del representante.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      await authService.registerClubOwner(data);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.message;
      const mensajeFinal = Array.isArray(mensajeBackend) ? mensajeBackend[0] : mensajeBackend;
      setErrorAlert({
        show: true,
        message: mensajeFinal || 'No se pudo registrar el club.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // --- VISTA DE ÉXITO (Rediseñada pero con los mismos datos) ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 animate-fade-in font-sans">
        <div className="max-w-lg w-full bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-10 text-center relative overflow-hidden">
          
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-emerald-500/5 z-0 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <IconCheck className="w-12 h-12 text-emerald-400" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">¡Registro Confirmado!</h2>
            <p className="text-slate-400 mb-8">
              Tu cuenta de <strong>Dueño de Club</strong> ha sido creada exitosamente.
            </p>

            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-8 text-left rounded-r-lg">
                <div className="flex gap-3">
                    <div className="text-amber-400 font-bold text-xl">⚠</div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-400 mb-1">Acceso Limitado Inicial</h3>
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                            Puedes ingresar al panel ahora mismo, pero funciones críticas (como generar códigos de invitación) estarán bloqueadas hasta que validemos tu institución manualmente.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate('/internal')}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-900/50 transition-all hover:-translate-y-1 uppercase tracking-wide"
            >
                Iniciar Sesión Ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FORMULARIO PRINCIPAL (Rediseñado Cyber-Industrial) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans py-12 px-4 sm:px-6 relative">
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                Nueva Afiliación
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                Registro de Club <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Oficial</span>
            </h1>
            <p className="text-slate-400 text-sm">Completa el manifiesto de inscripción para tu equipo.</p>
        </div>

        {/* Error Alert */}
        {errorAlert.show && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex justify-between items-start animate-shake shadow-lg shadow-red-900/20">
                <div>
                    <p className="text-red-400 font-bold text-sm uppercase tracking-wider">Error de Solicitud</p>
                    <p className="text-red-200/80 text-xs mt-1 font-mono">{errorAlert.message}</p>
                </div>
                <button onClick={() => setErrorAlert({ show: false, message: '' })} className="text-red-400 hover:text-white transition-colors">✕</button>
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* SECCIÓN 1: REPRESENTANTE */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shadow-blue-500/10 shadow-lg"><IconUser className="w-5 h-5"/></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Datos del Representante</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DNI */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Documento Nacional de Identidad</label>
                        <div className="relative group">
                            <input
                                {...register('dni', { 
                                    required: 'DNI requerido', 
                                    minLength: { value: 8, message: 'Mínimo 8 dígitos' },
                                    maxLength: { value: 8, message: 'Máximo 8 dígitos' },
                                    pattern: { value: /^[0-9]+$/, message: 'Solo números' }
                                })}
                                maxLength={8}
                                type="text"
                                onBlur={onBlurDni}
                                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 8); }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-700 font-mono tracking-wider shadow-inner"
                                placeholder="00000000"
                            />
                            {searchingDni && (
                                <div className="absolute right-3 top-3.5 flex items-center gap-2 pointer-events-none">
                                    <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
                                    <span className="text-[10px] text-blue-400 font-bold tracking-widest">BUSCANDO...</span>
                                </div>
                            )}
                        </div>
                        {errors.dni && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.dni.message as string}</span>}
                    </div>

                    {/* Nombres */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nombres</label>
                        <input
                            {...register('nombres', { required: 'Requerido' })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Ej: Juan Carlos"
                        />
                        {errors.nombres && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.nombres.message as string}</span>}
                    </div>

                    {/* Apellidos */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Apellidos</label>
                        <input
                            {...register('apellidos', { required: 'Requerido' })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Ej: Pérez López"
                        />
                        {errors.apellidos && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.apellidos.message as string}</span>}
                    </div>

                    {/* Fecha Nacimiento */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Fecha de Nacimiento</label>
                        <input
                            {...register('fechaNacimiento', { required: 'Requerido' })}
                            type="date"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all [color-scheme:dark]"
                        />
                        {errors.fechaNacimiento && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.fechaNacimiento.message as string}</span>}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: DATOS CLUB */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shadow-purple-500/10 shadow-lg"><IconBuilding className="w-5 h-5"/></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Información Institucional</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nombre Oficial del Club</label>
                        <input
                            {...register('nombreClub', { required: 'Requerido', minLength: 3 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Ej: Asociación de Robótica Arequipa"
                        />
                        {errors.nombreClub && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.nombreClub.message as string}</span>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Dirección Sede</label>
                        <input
                            {...register('direccion', { required: 'Requerido' })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Ej: Av. Ejército 123, Oficina 402"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Descripción Breve</label>
                        <textarea
                            {...register('descripcion', { required: 'Requerido' })}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-all placeholder-slate-700 resize-none"
                            placeholder="Especialidad del club, logros previos, etc..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: CREDENCIALES */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shadow-emerald-500/10 shadow-lg"><IconLock className="w-5 h-5"/></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Credenciales de Acceso</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Correo Electrónico</label>
                        <input
                            {...register('email', { 
                                required: 'Requerido', 
                                pattern: { value: /.+@.+\..+/, message: 'Email inválido' } 
                            })}
                            type="email"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all placeholder-slate-700"
                            placeholder="admin@clubrobotica.com"
                        />
                        {errors.email && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.email.message as string}</span>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Contraseña Maestra</label>
                        <input
                            {...register('password', { 
                                required: 'Requerido',
                                validate: (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(val) || 'Insegura'
                            })}
                            type="password"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all placeholder-slate-700"
                            placeholder="••••••••"
                        />
                        
                        {/* Indicadores de Fortaleza de Contraseña */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {passwordRequirements.map((req) => (
                                <div key={req.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold border transition-colors ${req.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${req.valid ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></span>
                                    {req.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800/50">
                <Link to="/internal" className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors group">
                    <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancelar operación
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-3
                        ${loading ? 'cursor-wait' : ''}
                    `}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Procesando Solicitud...
                        </>
                    ) : 'Confirmar Afiliación'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};