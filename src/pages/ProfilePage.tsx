import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useForm } from '../hooks/useForm';
import { userService } from '../services/resourceService';
import type { Usuario } from '../types/api';
import { getFriendlyError } from '../utils/errors';
import { ROL_LABELS } from '../utils/format';

interface ProfileFormValues {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validate = useCallback((values: ProfileFormValues) => {
    const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
    if (values.nombre.trim().length < 2) errors.nombre = 'Ingresa tu nombre completo.';
    if (!values.email.includes('@')) errors.email = 'Ingresa un correo valido.';
    if (values.password.length < 6) errors.password = 'Minimo 6 caracteres.';
    return errors;
  }, []);
  const form = useForm<ProfileFormValues>({ nombre: '', email: '', password: '', telefono: '', direccion: '' }, validate);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!user) return;
      setLoading(true);
      setError('');
      userService
        .get(user.userId, signal)
        .then((data) => {
          setProfile(data);
          form.reset({
            nombre: data.nombre,
            email: data.email,
            password: '',
            telefono: data.telefono ?? '',
            direccion: data.direccion ?? ''
          });
        })
        .catch((err) => setError(getFriendlyError(err)))
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !profile || !form.isValid) return;
    setSaving(true);
    try {
      // UsuarioRequestDTO.password tiene @NotBlank en el backend incluso para el PUT
      // de "actualizar perfil" (no hay un endpoint separado para cambiar contrasena).
      // Por eso este formulario pide siempre la contrasena: el usuario decide su valor
      // en cada guardado, en vez de que el frontend invente o reuse un valor por su cuenta.
      const updated = await userService.updateProfile(user.userId, {
        nombre: form.values.nombre,
        email: form.values.email,
        password: form.values.password,
        telefono: form.values.telefono || undefined,
        direccion: form.values.direccion || undefined,
        rol: profile.rol
      });
      setProfile(updated);
      notify('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      notify(getFriendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Cargando perfil" />;
  if (error || !profile) return <ErrorState message={error || 'No se pudo cargar tu perfil.'} onRetry={() => load()} />;

  return (
    <section className="page">
      <PageHeader title="Mi perfil" description="Actualiza tus datos personales." />
      <div className="content-grid">
        <form className="panel" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField
            label="Nombre completo"
            value={form.values.nombre}
            onChange={(e) => form.setField('nombre', e.target.value)}
            error={form.touched.nombre ? form.errors.nombre : undefined}
          />
          <FormField
            label="Correo"
            type="email"
            value={form.values.email}
            onChange={(e) => form.setField('email', e.target.value)}
            error={form.touched.email ? form.errors.email : undefined}
          />
          <FormField
            label="Confirma tu contrasena"
            type="password"
            value={form.values.password}
            onChange={(e) => form.setField('password', e.target.value)}
            error={form.touched.password ? form.errors.password : undefined}
            hint="El backend requiere la contrasena en cada actualizacion de perfil. Escribe la misma para no cambiarla, o una nueva para actualizarla."
          />
          <div className="field-row">
            <FormField label="Telefono" value={form.values.telefono} onChange={(e) => form.setField('telefono', e.target.value)} />
            <FormField label="Direccion" value={form.values.direccion} onChange={(e) => form.setField('direccion', e.target.value)} />
          </div>
          <button className="button button-primary" disabled={saving || !form.isValid}>
            <Save size={16} /> {saving ? 'Guardando' : 'Guardar cambios'}
          </button>
        </form>
        <div className="panel">
          <h2>Resumen de cuenta</h2>
          <div className="kv-list">
            <div className="kv-row">
              <span>ID</span>
              <strong className="cell-mono">#{profile.id}</strong>
            </div>
            <div className="kv-row">
              <span>Rol</span>
              <strong>{ROL_LABELS[profile.rol] ?? profile.rol}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
