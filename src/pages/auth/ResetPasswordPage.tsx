import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

// --- SERVICIO DE AUTENTICACIÓN INTEGRADO (Para evitar error de importación) ---
const authService = {
  resetPassword: async (token: string, newPassword: string) => {
    const API_URL = 'http://localhost:3000'; 
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error;
    }
  }
};
// -----------------------------------------------------------------------------

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  // 1. Obtenemos el TOKEN de la URL (ej: ?token=12345)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  // Estado para manejar notificaciones (reemplaza a SweetAlert2)
  const [status, setStatus] = useState<{type: 'error'|'success'|'warning', message: string} | null>(null);

  // 2. Validación de seguridad: Si no hay token, el usuario no debería estar aquí
  useEffect(() => {
    // Si no hay token, mostramos error y redirigimos
    if (!token) {
      setStatus({ 
        type: 'error', 
        message: 'No se encontró el token de seguridad. Vuelve a solicitar el correo.' 
      });
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [token, navigate]);

  const onSubmit = async (data: any) => {
    setStatus(null);
    
    if (data.password !== data.confirmPassword) {
      return setStatus({ type: 'warning', message: 'Las contraseñas no coinciden' });
    }

    setIsLoading(true);
    try {
      // 3. Enviamos el TOKEN (de la URL) y la NUEVA CLAVE al backend
      if (token) {
        await authService.resetPassword(token, data.password);
        
        setStatus({
          type: 'success',
          message: '¡Contraseña actualizada! Redirigiendo al Login...'
        });
        
        // Redirigir después de éxito
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      console.error(error);
      setStatus({
        type: 'error',
        message: error.message || 'El enlace ha expirado o ya fue usado.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prevenimos renderizar el formulario si ya estamos redirigiendo o si no hay token
  if (!token && status?.type !== 'error') return null; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Nueva Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu nueva contraseña para recuperar el acceso.
          </p>
        </div>

        {/* NOTIFICACIÓN INTEGRADA */}
        {status && (
          <div className={`p-4 mb-4 rounded text-sm font-medium ${
            status.type === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' : 
            status.type === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' :
            'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500'}`}>
            {status.message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* NUEVA CONTRASEÑA */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
              <input
                {...register('password', { 
                  required: "Requerido", 
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, message: "Debe incluir Mayúscula, minúscula, número y símbolo" }
                })}
                type="password"
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message as string}</span>}
            </div>

            {/* CONFIRMAR CONTRASEÑA */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
              <input
                {...register('confirmPassword', { 
                    required: "Requerido",
                    // Validación personalizada para coincidencia
                    validate: (value) => value === watch('password') || "Las contraseñas no coinciden"
                })}
                type="password"
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmPassword.message as string}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};