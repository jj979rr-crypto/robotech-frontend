import { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import api from '../../services/api';
import { categoryService } from '../../services/categoryService';
import type { Category } from '../../services/categoryService';
import { locationService } from '../../services/locationService';

// ✅ MUI DateTimePicker
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

type FormValues = {
  nombre: string;
  descripcion?: string;
  locationId: string;
  categoryId: string;
  minParticipantes?: string;
  maxParticipantes: string;

  // ✅ ahora Dayjs
  fechaInicio: Dayjs | null;
  fechaFin?: Dayjs | null;
};

type AvailabilityStatus = 'UNKNOWN' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export const CreateTournament = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fechaInicio: null,
      fechaFin: null,
    },
  });


  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityStatus>('UNKNOWN');
  const [availabilityReason, setAvailabilityReason] = useState('');
  const [availabilityConflicts, setAvailabilityConflicts] = useState<any[]>([]);

  // Watch fields (for availability checks)
  const locationId = useWatch({ control, name: 'locationId' });
  const fechaInicio = useWatch({ control, name: 'fechaInicio' });
  const fechaFin = useWatch({ control, name: 'fechaFin' });

  // Autocompletar horario por defecto SOLO si está vacío (no camisa de fuerza)
  useEffect(() => {
    const start = getValues('fechaInicio');
    const end = getValues('fechaFin');

    // Solo al entrar: si no hay fechas, asigna por defecto hoy 08:00 → 22:00
    if (!start) {
      const s = dayjs().hour(8).minute(0).second(0);
      const e = dayjs().hour(22).minute(0).second(0);

      setValue('fechaInicio', s, { shouldValidate: true });
      setValue('fechaFin', e, { shouldValidate: true });
    } else {
      // Si ya hay inicio y NO hay fin, asigna fin sugerido (mismo día 22:00)
      // pero SOLO si el usuario aún no puso fin.
      if (!end) {
        const e = start.hour(22).minute(0).second(0);
        setValue('fechaFin', e, { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // =========================
  //  CARGAR SEDES Y CATEGORÍAS
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, cats] = await Promise.all([
          api.get('/location', { params: { t: Date.now() } }),
          categoryService.getAll(),
        ]);

        setLocations(Array.isArray(locRes.data) ? locRes.data : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        console.error('Error cargando datos', error);
        Swal.fire('Error', 'No se pudieron cargar las sedes o categorías.', 'error');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!fechaInicio) return;

    const end = getValues('fechaFin');
    // Si el usuario no puso fechaFin, la sugieres en base al inicio
    if (!end) {
      const suggested = fechaInicio.hour(22).minute(0).second(0);
      setValue('fechaFin', suggested, { shouldValidate: true });
    }
  }, [fechaInicio, getValues, setValue]);


  // =========================
  //  VERIFICAR DISPONIBILIDAD DE SEDE (con buffer ±2 días)
  // =========================
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!locationId || !fechaInicio) {
        setAvailability('UNKNOWN');
        setAvailabilityReason('');
        setAvailabilityConflicts([]);
        return;
      }

      try {
        const startDate = fechaInicio.toDate();
        const endDate = (fechaFin ?? fechaInicio).toDate();

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        const res = await locationService.getAvailability(locationId, startISO, endISO);

        if (!alive) return;
        setAvailability(res?.status ?? 'UNKNOWN');
        setAvailabilityReason(res?.reason ?? '');
        setAvailabilityConflicts(Array.isArray(res?.conflicts) ? res.conflicts : []);
      } catch (e) {
        if (!alive) return;
        setAvailability('UNKNOWN');
        setAvailabilityReason('No se pudo verificar disponibilidad.');
        setAvailabilityConflicts([]);
      }
    };

    const t = setTimeout(run, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [locationId, fechaInicio, fechaFin]);

  // =========================
  //  SUBMIT
  // =========================
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      if (!data.fechaInicio) throw new Error('La fecha de inicio es obligatoria');

      // Bloqueo extra (por si alguien intenta forzar)
      if (availability === 'OCCUPIED' || availability === 'MAINTENANCE') {
        throw new Error(availabilityReason || 'La sede no está disponible para esas fechas.');
      }

      // ✅ Dayjs -> ISO
      const toISO = (d?: Dayjs | null) => (d ? d.toDate().toISOString() : null);

      // Validación extra de fin >= inicio (si elige fin)
      if (data.fechaFin && data.fechaInicio && data.fechaFin.isBefore(data.fechaInicio)) {
        throw new Error('La fecha fin no puede ser anterior a la fecha inicio');
      }

      const payload: any = {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        categoryId: parseInt(data.categoryId, 10),
        maxParticipantes: parseInt(data.maxParticipantes, 10),
        minParticipantes: data.minParticipantes ? parseInt(data.minParticipantes, 10) : 8,
        fechaInicio: toISO(data.fechaInicio),
        fechaFin: toISO(data.fechaFin ?? null),
        locationId: data.locationId || null,
      };

      await api.post('/tournament', payload);

      await Swal.fire({
        icon: 'success',
        title: '¡Torneo Creado!',
        text: 'El torneo se ha registrado exitosamente.',
        confirmButtonColor: '#10B981',
        timer: 2000,
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error al crear torneo:', error);

      const backendMessage = error?.response?.data?.message;
      const msg = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || error.message || 'No se pudo crear el torneo';

      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: msg,
        confirmButtonColor: '#EF4444',
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  //  RENDER
  // =========================
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {/* HEADER */}
          <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Nuevo Torneo</h1>
              <p className="text-slate-400 text-sm">Configura el próximo gran evento.</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-sm hover:text-white text-slate-400 font-medium transition-colors"
            >
              ✕ Cancelar
            </button>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {/* NOMBRE Y LUGAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nombre del Evento
                </label>
                <input
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border outline-none transition-all"
                  placeholder="Ej: Gran Copa Robotech 2025"
                />
                {errors.nombre && (
                  <span className="text-red-500 text-xs font-bold">{errors.nombre.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sede / Coliseo</label>

                <select
                  {...register('locationId', { required: 'Debes seleccionar una sede' })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border bg-white outline-none transition-all"
                >
                  <option value="">Selecciona una sede...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre} (Cap: {loc.capacidad})
                      {loc.disponible === false ? ' — Mantenimiento' : ''}
                    </option>
                  ))}
                </select>

                {/* Badge disponibilidad */}
                {availability !== 'UNKNOWN' && (
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-start gap-2 px-3 py-2 rounded-md text-sm font-semibold ${
                        availability === 'AVAILABLE'
                          ? 'bg-green-50 text-green-700'
                          : availability === 'OCCUPIED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-800'
                      }`}
                    >
                      <span>
                        {availability === 'AVAILABLE'
                          ? '✅ Disponible'
                          : availability === 'OCCUPIED'
                          ? '⛔ Ocupada'
                          : '🛠️ Mantenimiento'}
                      </span>
                      <span className="font-normal">{availabilityReason}</span>
                    </div>

                    {availability === 'OCCUPIED' && availabilityConflicts.length > 0 && (
                      <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2">
                        <div className="font-bold mb-1">Conflictos detectados:</div>
                        <ul className="list-disc ml-5 space-y-1">
                          {availabilityConflicts.slice(0, 3).map((c: any) => (
                            <li key={c.id}>
                              {c.nombre} — {new Date(c.fechaInicio).toLocaleString()}
                              {c.fechaFin ? ` → ${new Date(c.fechaFin).toLocaleString()}` : ''}
                            </li>
                          ))}
                        </ul>
                        {availabilityConflicts.length > 3 && (
                          <div className="mt-1">…y {availabilityConflicts.length - 3} más.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {errors.locationId && (
                  <span className="text-red-500 text-xs font-bold">{errors.locationId.message}</span>
                )}

                {locations.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1 font-medium bg-orange-50 p-1 rounded">
                    ⚠️ No hay sedes registradas.
                  </p>
                )}
              </div>
            </div>

            {/* CATEGORÍA Y CUPOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Categoría de Robots
                </label>
                <select
                  {...register('categoryId', { required: 'Selecciona una categoría' })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border bg-white outline-none transition-all"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.gameType}
                      {cat.maxWeightGrams > 0 ? ` - ${cat.maxWeightGrams}g` : ' - Libre'})
                    </option>
                  ))}
                </select>

                {errors.categoryId && (
                  <span className="text-red-500 text-xs font-bold">{errors.categoryId.message}</span>
                )}

                {categories.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1 font-medium bg-orange-50 p-1 rounded">
                    ⚠️ Cargando categorías...
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mínimo Part.</label>
                  <input
                    type="number"
                    defaultValue={8}
                    {...register('minParticipantes', {
                      required: true,
                      min: { value: 2, message: 'Mín 2' },
                    })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Máximo Part.</label>
                  <input
                    type="number"
                    defaultValue={16}
                    {...register('maxParticipantes', {
                      required: true,
                      min: { value: 2, message: 'Mín 2' },
                      max: { value: 64, message: 'Máx 64' },
                    })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* FECHAS (MUI DateTimePicker) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                  Inicio del Evento
                </label>

                <Controller
                  name="fechaInicio"
                  control={control}
                  rules={{ required: 'Fecha requerida' }}
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      minDateTime={dayjs()} // no permitir pasado
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />

                {errors.fechaInicio && (
                  <span className="text-red-500 text-xs font-bold">
                    {String(errors.fechaInicio.message ?? 'Requerido')}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                  Fin del Evento (Opcional)
                </label>

                <Controller
                  name="fechaFin"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      minDateTime={fechaInicio ?? dayjs()}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </div>

              {/* Info política */}
              <div className="md:col-span-2 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-md p-2">
                ℹ️ Política de sede: se reservan <b>2 días antes</b> y <b>2 días después</b> del
                torneo para preparación, limpieza y desmontaje.
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Descripción / Reglas
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border outline-none resize-none transition-all"
                placeholder="Detalles adicionales, premios, reglas específicas..."
              />
            </div>

            {/* BOTÓN */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              {(availability === 'OCCUPIED' || availability === 'MAINTENANCE') && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-2 mr-auto">
                  No puedes publicar: {availabilityReason || 'La sede no está disponible.'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || availability === 'OCCUPIED' || availability === 'MAINTENANCE'}
                className={`px-8 py-3 bg-slate-900 text-white font-bold rounded-lg shadow-lg hover:bg-slate-800 hover:shadow-xl transform transition-all active:scale-95 flex items-center gap-2 ${
                  loading || availability === 'OCCUPIED' || availability === 'MAINTENANCE'
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>🚀 Publicar Torneo</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LocalizationProvider>
  );
};
