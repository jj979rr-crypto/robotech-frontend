import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { locationService } from '../../services/locationService';

type FormValues = {
  nombre: string;
  direccion: string;
  capacidad: string;
  descripcion?: string;
  disponible: 'true' | 'false';
  foto?: FileList;
  croquis?: FileList;
};

export const CreateLocation = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { disponible: 'true' },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('nombre', data.nombre);
      formData.append('direccion', data.direccion);
      formData.append('capacidad', data.capacidad);
      formData.append('descripcion', data.descripcion || '');
      formData.append('disponible', data.disponible ?? 'true');

      if (data.foto?.length) formData.append('foto', data.foto[0]);
      if (data.croquis?.length) formData.append('croquis', data.croquis[0]);

      await locationService.createLocation(formData);

      await Swal.fire({
        icon: 'success',
        title: '¡Sede Creada!',
        text: 'El coliseo y sus imágenes han sido registrados exitosamente.',
        confirmButtonColor: '#233630ff',
      });

      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo crear la sede. Verifica los datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-indigo-900 px-8 py-6 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Nueva Sede / Coliseo</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-sm hover:text-white text-indigo-200"
          >
            ✕ Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
            <input
              {...register('nombre', { required: 'Nombre requerido' })}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border"
            />
            {errors.nombre && (
              <span className="text-red-500 text-xs">{String(errors.nombre.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
            <input
              {...register('direccion', { required: 'Dirección requerida' })}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Capacidad</label>
            <input
              type="number"
              {...register('capacidad', { required: 'Capacidad requerida' })}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
            <select
              {...register('disponible')}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border bg-white"
            >
              <option value="true">✅ Disponible</option>
              <option value="false">🛠️ En mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Foto</label>
            <input type="file" accept="image/*" {...register('foto')} className="w-full text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Croquis</label>
            <input type="file" accept="image/*" {...register('croquis')} className="w-full text-sm" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition"
          >
            {loading ? 'Guardando...' : '💾 Registrar Sede'}
          </button>
        </form>
      </div>
    </div>
  );
};
