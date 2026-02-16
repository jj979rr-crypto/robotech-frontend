import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { clubService } from "../../services/clubService";
import { tournamentService } from "../../services/tournamentService";
import { locationService } from "../../services/locationService";
import { userService } from "../../services/userService";
import { categoryService} from "../../services/categoryService";
import { logoutAndRedirect } from '../../services/logoutHelper';

// -- Configuracion --

// ✅ CORRECCIÓN IMPORTANTE:
// Apuntamos solo a la raíz, porque la BD ya trae "uploads/locations/..."
const BASE_IMAGE_URL = 'https://robotech-tjw0.onrender.com/';


// --- INTERFACES ---

interface Category {
  id: number;
  name: string;
  maxWeightGrams: number;
  gameType: string;
}

interface UserOwner {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  isLocked: boolean;
}

interface Club {
  id: string;
  nombre: string;
  direccion: string;
  descripcion?: string;
  status: 'pending' | 'approved' | 'rejected';
  owner?: UserOwner;
}

export interface Tournament {
  id: string;
  nombre: string;
  descripcion?: string;
  category?: Category;
  fechaInicio: string;
  fechaFin?: string;
  maxParticipantes?: number;
  minParticipantes?: number;
  inscripcionAbierta?: boolean;
  esPublico?: boolean;
  location?: {
    id: string;
    nombre: string;
    direccion: string;
  };
}

interface Location {
  id: string;
  nombre: string;
  direccion: string;
  capacidad: number;
  descripcion?: string;
  imagenUrl?: string;
  mapaUrl?: string;
  disponible?: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: 'question' | 'success' | 'error' | 'info' | 'edit' | 'danger';
  title: string;
  text?: string;
  showCancel: boolean;
  confirmText: string;
  confirmColor: string;
  onConfirm: () => void;
  editType?: 'club' | 'tournament' | 'location';
}

export const DashboardAdmin = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    logoutAndRedirect(navigate);
  };

  // ESTADOS
  // ✅ MODIFICADO: Agregamos 'judges' a las pestañas disponibles
  const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'tournaments' | 'locations' | 'judges'>('overview');

  const [clubs, setClubs] = useState<Club[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // ✅ NUEVO: Estado para el formulario de Jueces y Visibilidad de Password
  const [judgeForm, setJudgeForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false); // <--- NUEVO ESTADO PARA EL OJO

  // MODAL & EDICIÓN
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    text: '',
    showCancel: false,
    confirmText: 'OK',
    confirmColor: 'bg-indigo-600',
    onConfirm: () => { },
  });
  const [editForm, setEditForm] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [c, t, l, cats] = await Promise.allSettled([
      clubService.getAll(),
      tournamentService.getAllTournaments(),
      locationService.getAllLocations(),
      categoryService.getAll(),
    ]);

    setClubs(c.status === 'fulfilled' ? c.value : []);
    setTournaments(t.status === 'fulfilled' ? t.value : []);
    setLocations(l.status === 'fulfilled' ? l.value : []);
    setCategories(cats.status === 'fulfilled' ? cats.value : []);
  };

  const closeModal = () => {
    if (!isProcessing) setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (msg: string) => {
    setTimeout(() => {
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Éxito',
        text: msg,
        showCancel: false,
        confirmText: 'OK',
        confirmColor: 'bg-green-600',
        onConfirm: () => closeModal(),
      });
    }, 100);
  };

  const showError = (msg: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error',
      text: msg,
      showCancel: false,
      confirmText: 'Cerrar',
      confirmColor: 'bg-gray-600',
      onConfirm: () => closeModal(),
    });
  };

  // --- ACCIONES ---

  const handleStatusChange = (club: Club, newStatus: 'approved' | 'rejected' | 'pending') => {
    const actionMap: Record<string, string> = {
      approved: 'Aprobar',
      rejected: 'Rechazar/Inhabilitar',
      pending: 'Poner Pendiente',
    };

    setModal({
      isOpen: true,
      type: 'question',
      title: `¿${actionMap[newStatus]} Club?`,
      text: `Estás a punto de cambiar el estado de "${club.nombre}".`,
      showCancel: true,
      confirmText: 'Sí, Cambiar',
      confirmColor: newStatus === 'approved' ? 'bg-green-600' : 'bg-red-600',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await clubService.updateStatus(club.id, newStatus);
          await loadAllData();
          setIsProcessing(false);
          closeModal();
          showSuccess('Estado actualizado correctamente.');
        } catch {
          setIsProcessing(false);
          showError('Error al actualizar estado.');
        }
      },
    });
  };

  const handleUnlockUser = (ownerId: string) => {
    setModal({
      isOpen: true,
      type: 'question',
      title: 'Desbloquear Usuario',
      text: '¿Restablecer el acceso al representante?',
      showCancel: true,
      confirmText: 'Desbloquear',
      confirmColor: 'bg-orange-500',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await userService.unlockStaff(ownerId);
          await loadAllData();
          setIsProcessing(false);
          closeModal();
          showSuccess('Usuario desbloqueado.');
        } catch {
          setIsProcessing(false);
          showError('No se pudo desbloquear.');
        }
      },
    });
  };

  const handleTogglePublish = async (torneo: Tournament) => {
    const accion = torneo.esPublico ? 'ocultar de público' : 'publicar';

    const result = await Swal.fire({
      title: `¿Seguro que quieres ${accion}?`,
      text: torneo.esPublico
        ? 'El torneo dejará de aparecer en la página pública y en el marketplace de competidores.'
        : 'El torneo aparecerá en la página pública y en el marketplace (si las inscripciones están abiertas).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a',
    });

    if (!result.isConfirmed) return;

    try {
      await tournamentService.update(torneo.id, {
        esPublico: !torneo.esPublico,
      });

      await loadAllData();

      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: torneo.esPublico
          ? 'El torneo ahora está oculto del público.'
          : 'El torneo ahora está publicado.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      Swal.fire(
        'Error',
        Array.isArray(msg) ? msg[0] : msg || 'No se pudo actualizar la visibilidad del torneo.',
        'error',
      );
    }
  };

  const handleToggleLocationAvailability = (loc: Location) => {
    const newValue = loc.disponible === false; // si estaba mantenimiento -> true, si estaba disponible -> false

    setModal({
      isOpen: true,
      type: 'question',
      title: newValue ? 'Marcar como Disponible' : 'Poner en Mantenimiento',
      text: `Cambiar estado de "${loc.nombre}".`,
      showCancel: true,
      confirmText: 'Sí, cambiar',
      confirmColor: newValue ? 'bg-green-600' : 'bg-red-600',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          await locationService.updateAvailability(loc.id, newValue); // ✅ AQUÍ
          await loadAllData();

          setIsProcessing(false);
          closeModal();
          showSuccess('Estado de la sede actualizado.');
        } catch (e: any) {
          setIsProcessing(false);
          showError(e?.response?.data?.message || 'No se pudo actualizar el estado de la sede.');
        }
      },
    });
  };



  // ✅ NUEVO: Lógica para registrar Juez (Solo Email y Password)
  const handleRegisterJudge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judgeForm.email || !judgeForm.password) {
      showError('Por favor ingresa correo y contraseña.');
      return;
    }

    setIsProcessing(true);
    try {
      await userService.createJudge({
        email: judgeForm.email,
        password: judgeForm.password
      });

      setIsProcessing(false);
      setJudgeForm({ email: '', password: '' });
      showSuccess('Juez registrado correctamente en la base de datos.');
    } catch (error: any) {
      setIsProcessing(false);
      const msg = error?.response?.data?.message || 'Error al registrar juez.';
      showError(msg);
    }
  };


  // --- LÓGICA DE EDICIÓN ---

  const openEditModal = (item: any, type: 'club' | 'tournament' | 'location') => {
    let formData = { ...item };

    if (type === 'club') {
      formData = {
        ...item,
        ownerName: item.owner?.nombres || '',
        ownerLastname: item.owner?.apellidos || '',
        ownerDni: item.owner?.dni || '',
        ownerId: item.owner?.id,
      };
    }

    if (type === 'tournament') {
      formData = {
        ...item,
        categoryId: item.category?.id || '',
      };
    }

    setEditForm(formData);
    setModal({
      isOpen: true,
      type: 'edit',
      title:
        type === 'club'
          ? 'Editar Club'
          : type === 'tournament'
            ? 'Editar Torneo'
            : 'Editar Sede',
      editType: type,
      showCancel: true,
      confirmText: 'Guardar Cambios',
      confirmColor: 'bg-blue-600',
      onConfirm: () => { },
    });
  };

  const handleSaveEdit = async (type: 'club' | 'tournament' | 'location') => {
    setIsProcessing(true);
    try {
      if (type === 'club') {
        await clubService.update(editForm.id, {
          nombre: editForm.nombre,
          direccion: editForm.direccion,
          descripcion: editForm.descripcion,
        });
      }

      if (type === 'tournament') {
        await tournamentService.update(editForm.id, {
          nombre: editForm.nombre,
          fechaInicio: editForm.fechaInicio,
          fechaFin: editForm.fechaFin,
          categoryId: Number(editForm.categoryId),
          maxParticipantes: editForm.maxParticipantes,
        });
      }

      if (type === 'location') {
        const formData = new FormData();
        formData.append('nombre', editForm.nombre);
        formData.append('direccion', editForm.direccion);
        formData.append('capacidad', String(editForm.capacidad));
        formData.append('descripcion', editForm.descripcion || '');

        // ✅ IMPORTANTE: estos nombres deben coincidir con tu backend
        if (editForm.newFoto) {
          formData.append('foto', editForm.newFoto);
        }
        if (editForm.newCroquis) {
          formData.append('croquis', editForm.newCroquis);
        }

        await locationService.updateLocation(editForm.id, formData);
      }

      await loadAllData();
      setIsProcessing(false);
      closeModal();
      showSuccess('Datos guardados.');
    } catch (e: any) {
      setIsProcessing(false);

      const status = e?.response?.status;
      const message = e?.response?.data?.message || '';

      if (status === 409 || message.includes('duplicate') || message.includes('unique')) {
        Swal.fire(
          'Nombre Duplicado',
          'Ya existe un registro con ese nombre. Por favor, elige otro.',
          'error',
        );
      } else {
        showError('No se pudo guardar los cambios.');
      }
    }
  };


  // --- LÓGICA DE ELIMINACIÓN ---

  const handleDelete = (
    id: string,
    type: 'club' | 'tournament' | 'location',
    name: string,
  ) => {
    setModal({
      isOpen: true,
      type: 'danger',
      title: `Eliminar "${name}"`,
      text: 'Si eliminas este registro, se perderán todos los datos vinculados. ¿Estás seguro?',
      showCancel: true,
      confirmText: 'Sí, Eliminar',
      confirmColor: 'bg-red-700',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          if (type === 'club') await clubService.delete(id);
          if (type === 'tournament') await tournamentService.delete(id);
          if (type === 'location') await locationService.deleteLocation(id);

          await loadAllData();

          setIsProcessing(false);
          closeModal();
          showSuccess('Registro eliminado.');
        } catch (error: any) {
          setIsProcessing(false);

          const msg = error?.response?.data?.message;
          Swal.fire(
            'No se puede eliminar',
            Array.isArray(msg) ? msg[0] : msg || 'El registro tiene datos asociados.',
            'error',
          );
        }
      },
    });
  };


  // --- CONFIRMACIÓN GENERAL DEL MODAL ---

  const handleModalConfirm = () => {
    if (modal.type === 'edit' && modal.editType) {
      handleSaveEdit(modal.editType);
      return;
    }
    if (modal.onConfirm) {
      modal.onConfirm();
    }
  };

  // --- RENDERIZADO DE MODAL (SOLO EDICIÓN) ---

  const renderModalContent = () => {
    if (modal.type !== 'edit')
      return (
        <p className="text-sm text-gray-600 mb-6 px-2 font-medium">
          {modal.text}
        </p>
      );

    return (
      <div className="text-left w-full mt-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded outline-none"
            value={editForm.nombre || ''}
            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
          />
        </div>

        {modal.editType === 'club' && (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dirección</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={editForm.direccion || ''}
                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
              <textarea
                className="w-full border border-gray-300 p-2 rounded outline-none resize-none h-20"
                value={editForm.descripcion || ''}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded border mt-2 opacity-70">
              <h4 className="text-xs font-black text-gray-400 uppercase mb-2">
                Representante (No editable)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold">Nombre:</span> {editForm.ownerName}{' '}
                  {editForm.ownerLastname}
                </div>
                <div>
                  <span className="font-bold">DNI:</span> {editForm.ownerDni}
                </div>
              </div>
            </div>
          </>
        )}

        {(modal.editType === 'location' || modal.editType === 'club') &&
          modal.editType !== 'club' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dirección</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={editForm.direccion || ''}
                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
              />
            </div>
          )}

        {/* CAMPOS ESPECÍFICOS DE LOCATION */}
          {modal.editType === 'location' && (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Capacidad (Personas)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={editForm.capacidad || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, capacidad: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
              <textarea
                className="w-full border border-gray-300 p-2 rounded outline-none resize-none h-20"
                value={editForm.descripcion || ''}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                placeholder="Detalles de la sede..."
              />
            </div>

            <div className="border-t pt-4 mt-4 border-gray-100">
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Cambiar Imagen Principal (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setEditForm({ ...editForm, newFoto: e.target.files[0] });
                  }
                }}
              />
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Cambiar Croquis (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setEditForm({ ...editForm, newCroquis: e.target.files[0] });
                  }
                }}
              />
            </div>
          </>
        )}

        {modal.editType === 'tournament' && (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Categoría
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded outline-none bg-white"
                value={editForm.categoryId || ''}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.gameType} - {cat.maxWeightGrams}g)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Participantes (cupos)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={editForm.maxParticipantes ?? ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    maxParticipantes: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={
                  editForm.fechaInicio
                    ? new Date(editForm.fechaInicio).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  const iso = new Date(raw).toISOString();
                  setEditForm({ ...editForm, fechaInicio: iso });
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Fecha de Fin
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 p-2 rounded outline-none"
                value={
                  editForm.fechaFin
                    ? new Date(editForm.fechaFin).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  const iso = new Date(raw).toISOString();
                  setEditForm({ ...editForm, fechaFin: iso });
                }}
              />
            </div>
          </>
        )}

      </div>
    );
  };

  // --- TABLAS ---

  const renderClubsTable = () => (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100 animate-fade-in">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Club
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Acciones Rápidas
            </th>
            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
              Gestión
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clubs.map((club) => (
            <tr key={club.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-900">{club.nombre}</div>

                <div className="text-xs text-gray-600 mt-0.5">
                  {club.owner
                    ? `${club.owner.nombres} ${club.owner.apellidos} · ${club.owner.email}`
                    : 'Sin representante asignado'}
                </div>

                <div className="text-[11px] text-gray-400 mt-0.5">
                  {club.direccion}
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold border ${club.status === 'approved'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : club.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                >
                  {club.status === 'approved'
                    ? 'ACTIVO'
                    : club.status === 'rejected'
                      ? 'INHABILITADO'
                      : 'PENDIENTE'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {club.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(club, 'approved')}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-xs font-bold transition"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => handleStatusChange(club, 'rejected')}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-bold transition"
                      >
                        ✕ Rechazar
                      </button>
                    </>
                  )}
                  {club.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(club, 'rejected')}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded text-xs font-bold transition"
                    >
                      🚫 Inhabilitar
                    </button>
                  )}
                  {club.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(club, 'approved')}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-bold transition"
                    >
                      ↺ Habilitar
                    </button>
                  )}

                  {club.owner?.isLocked && (
                    <button
                      onClick={() => handleUnlockUser(club.owner!.id)}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-xs font-bold transition animate-pulse border border-yellow-300"
                    >
                      🔓 Desbloquear Usuario
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button
                  onClick={() => openEditModal(club, 'club')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline transition"
                >
                  Editar
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => handleDelete(club.id, 'club', club.nombre)}
                  className="text-red-600 hover:text-red-800 text-xs font-bold hover:underline transition"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {clubs.length === 0 && (
        <div className="p-12 text-center text-gray-400">No hay clubes registrados.</div>
      )}
    </div>
  );

  const renderTournamentsTable = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/admin/create-tournament')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition hover:-translate-y-0.5"
        >
          + Crear Torneo
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Participantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Sede / Coliseo
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado / Acciones
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {tournaments.map((t) => {
              const publicado = !!t.esPublico;
              const inscripcionesAbiertas = !!t.inscripcionAbierta;

              return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{t.nombre}</td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.category?.name || '–'}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.maxParticipantes ?? '–'}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.fechaInicio ? new Date(t.fechaInicio).toLocaleString() : 'N/A'}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.fechaFin ? new Date(t.fechaFin).toLocaleString() : 'N/A'}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.location?.nombre || 'Sin sede'}
                  </td>

                  <td className="px-6 py-4 text-right space-y-2 whitespace-nowrap">
                    {/* Etiquetas de estado */}
                    <div className="flex justify-end gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${inscripcionesAbiertas
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                      >
                        {inscripcionesAbiertas
                          ? 'Inscripciones abiertas'
                          : 'Inscripciones cerradas'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${publicado
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                      >
                        {publicado ? 'Público' : 'Oculto'}
                      </span>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(t, 'tournament')}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline transition"
                      >
                        Editar
                      </button>

                      <span className="text-gray-300">|</span>

                      <button
                        onClick={() => handleDelete(t.id, 'tournament', t.nombre)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold hover:underline transition"
                      >
                        Eliminar
                      </button>

                      <button
                        onClick={() => handleTogglePublish(t)}
                        className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border transition ${publicado
                            ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'
                            : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                          }`}
                      >
                        {publicado ? 'Ocultar' : 'Publicar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tournaments.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No hay torneos registrados.
          </div>
        )}
      </div>
    </div>
  );




  const renderLocationsTable = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/admin/create-location')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition hover:-translate-y-0.5"
        >
          + Nueva Sede
        </button>
      </div>
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Sede / Coliseo
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Info & Capacidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* CAMBIO: Mostrar miniatura de la imagen */}
                    {l.imagenUrl ? (
                      <img
                        src={`${BASE_IMAGE_URL}${l.imagenUrl}`}
                        alt={l.nombre}
                        className="w-12 h-12 rounded object-cover border border-gray-200 shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/50?text=Sede' }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{l.nombre}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {l.direccion}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-700">{l.capacidad.toLocaleString()} pax</div>
                  {l.mapaUrl && (
                    <a
                      href={`${BASE_IMAGE_URL}${l.mapaUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      🗺️ Ver Croquis
                    </a>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold border ${l.disponible !== false
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                  >
                    {l.disponible !== false ? 'DISPONIBLE' : 'MANTENIMIENTO'}
                  </span>
                </td>


                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="inline-flex flex-col items-end gap-2">
                    {/* Estado/acción principal */}
                    <div className="flex justify-end gap-2">


                      <button
                        onClick={() => handleToggleLocationAvailability(l)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                          l.disponible !== false
                            ? 'border-red-400 text-red-700 hover:bg-red-50'
                            : 'border-green-400 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {l.disponible !== false ? 'Poner mantenimiento' : 'Poner disponible'}
                      </button>
                    </div>

                    {/* Links simples */}
                    <div className="text-xs">
                      <button
                        onClick={() => openEditModal(l, 'location')}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition"
                      >
                        Editar
                      </button>
                      <span className="text-gray-300 mx-2">|</span>
                      <button
                        onClick={() => handleDelete(l.id, 'location', l.nombre)}
                        className="text-red-600 hover:text-red-800 font-bold hover:underline transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        {locations.length === 0 && (
          <div className="p-12 text-center text-gray-400">No hay sedes registradas.</div>
        )}
      </div>
    </div>
  );

  // ✅ NUEVO: Renderizado de la pestaña de Jueces
  const renderJudgesTab = () => (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        
        {/* Lado Izquierdo: Información / Decoración */}
        <div className="md:w-1/3 bg-indigo-900 p-8 text-white flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-indigo-800 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">
            ⚖️
          </div>
          <h3 className="text-xl font-bold mb-2">Panel de Jueces</h3>
          <p className="text-indigo-200 text-sm">
            Registra las credenciales de acceso para los jueces del torneo.
          </p>
          <div className="mt-8 text-xs text-indigo-400 bg-indigo-950 p-3 rounded border border-indigo-800">
            Nota: Solo se registrará el correo y contraseña para el acceso al sistema.
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="md:w-2/3 p-8 md:p-12">
          <h2 className="text-2xl font-black text-gray-800 mb-6">Registrar Nuevo Juez</h2>
          
          <form onSubmit={handleRegisterJudge} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">✉️</span>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="juez@robotech.com"
                  value={judgeForm.email}
                  onChange={(e) => setJudgeForm({ ...judgeForm, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Contraseña
              </label>
              <div className="relative">
                {/* Ícono Izquierdo (Candado) */}
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔒</span>
                
                {/* Input con Tipo Dinámico */}
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="••••••••"
                  value={judgeForm.password}
                  onChange={(e) => setJudgeForm({ ...judgeForm, password: e.target.value })}
                />

                {/* ✅ Botón Ojo (Ver/Ocultar) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors outline-none"
                >
                  {showPassword ? (
                    // Ícono Ojo Cerrado (Ocultar)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Ícono Ojo Abierto (Ver)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">Mínimo 6 caracteres recomendados</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 px-6 rounded-lg text-white font-bold shadow-lg transform transition hover:-translate-y-0.5 ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-wait' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isProcessing ? 'Registrando...' : 'Crear Cuenta de Juez'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <span className="text-4xl mb-2">🏢</span>
        <h3 className="text-gray-500 text-sm font-bold uppercase">Clubes</h3>
        <p className="text-3xl font-black text-gray-800">{clubs.length}</p>
        <p className="text-xs text-yellow-600 font-bold mt-1">
          {clubs.filter((c) => c.status === 'pending').length} Pendientes
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <span className="text-4xl mb-2">🏆</span>
        <h3 className="text-gray-500 text-sm font-bold uppercase">Torneos</h3>
        <p className="text-3xl font-black text-gray-800">{tournaments.length}</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <span className="text-4xl mb-2">📍</span>
        <h3 className="text-gray-500 text-sm font-bold uppercase">Sedes</h3>
        <p className="text-3xl font-black text-gray-800">{locations.length}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            ROBOTECH<span className="text-blue-600">.ADMIN</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>📊</span> Resumen
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'clubs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>🏢</span> Clubes
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'tournaments'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>🏆</span> Torneos
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'locations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>📍</span> Sedes
          </button>
          
          {/* ✅ NUEVO: Botón en Sidebar para Jueces */}
          <button
            onClick={() => setActiveTab('judges')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'judges'
                ? 'bg-indigo-600 text-white shadow-md' // Color diferenciado
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>⚖️</span> Jueces
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-red-600 font-bold border border-red-100 rounded-xl hover:bg-red-50 text-sm transition flex items-center justify-center gap-2"
          >
            <span></span> Cerrar Sesión
          </button>
        </div>

      </aside>

      <main className="flex-1 md:ml-64 p-8">
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={closeModal}
            ></div>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-8 relative z-10 flex flex-col items-center text-center animate-scale-up">
              <div className="mb-5">
                {modal.type === 'edit' && (
                  <div className="w-16 h-16 rounded-full border-2 border-blue-200 flex items-center justify-center text-blue-500 text-3xl">
                    ✎
                  </div>
                )}
                {modal.type === 'danger' && (
                  <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center text-red-600 text-3xl animate-pulse">
                    ⚠️
                  </div>
                )}
                {modal.type === 'success' && (
                  <div className="w-16 h-16 rounded-full border-2 border-green-200 flex items-center justify-center text-green-500 text-3xl">
                    ✓
                  </div>
                )}
                {modal.type === 'error' && (
                  <div className="w-16 h-16 rounded-full border-2 border-red-200 flex items-center justify-center text-red-500 text-3xl">
                    ✕
                  </div>
                )}
                {modal.type === 'info' && (
                  <div className="w-16 h-16 rounded-full border-2 border-blue-200 flex items-center justify-center text-blue-500 text-3xl">
                    i
                  </div>
                )}
                {modal.type === 'question' && (
                  <div className="w-16 h-16 rounded-full border-2 border-indigo-200 flex items-center justify-center text-indigo-500 text-3xl">
                    ?
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-700 mb-2">{modal.title}</h2>

              {renderModalContent()}

              <div className="flex gap-3 justify-center w-full mt-4">
                {modal.showCancel && (
                  <button
                    onClick={closeModal}
                    disabled={isProcessing}
                    className="px-6 py-2 rounded shadow-sm bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                  >
                    Cancelar
                  </button>
                )}
                {modal.type !== 'info' && (
                  <button
                    onClick={handleModalConfirm}
                    disabled={isProcessing}
                    className={`px-8 py-2 rounded shadow-md text-white font-medium text-sm ${modal.confirmColor} ${isProcessing ? 'opacity-70 cursor-wait' : ''
                      }`}
                  >
                    {isProcessing ? 'Procesando...' : modal.confirmText}
                  </button>
                )}
                {modal.type === 'info' && (
                  <button
                    onClick={closeModal}
                    className="px-8 py-2 rounded shadow-md text-white font-medium text-sm bg-indigo-600"
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden mb-6 flex justify-between items-center">
          <h1 className="text-xl font-black text-gray-800">
            ROBOTECH<span className="text-blue-600">.ADMIN</span>
          </h1>
        </div>

        <div className="mb-8">
          {/* ✅ Título Dinámico */}
          <h2 className="text-3xl font-bold text-gray-800 capitalize tracking-tight">
            {activeTab === 'overview'
              ? 'Resumen General'
              : activeTab === 'clubs'
                ? 'Gestión de Clubes'
                : activeTab === 'tournaments'
                  ? 'Gestión de Torneos'
                  : activeTab === 'locations'
                    ? 'Gestión de Sedes'
                    : 'Gestión de Jueces'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'judges' ? 'Alta de usuarios con rol de juez.' : 'Panel de control maestro.'}
          </p>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'clubs' && renderClubsTable()}
        {activeTab === 'tournaments' && renderTournamentsTable()}
        {activeTab === 'locations' && renderLocationsTable()}
        {activeTab === 'judges' && renderJudgesTab()} {/* ✅ Render de nueva pestaña */}
      </main>
    </div>
  );
}