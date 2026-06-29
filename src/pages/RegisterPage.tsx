import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { FormField } from '../components/ui/FormField';
import { FormSelect } from '../components/ui/FormSelect';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { useToast } from '../contexts/ToastContext';
import type { Rol } from '../types/api';

interface RegisterFormValues {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  rol: Rol;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { notify } = useToast();
  const [error, setError] = useState('');

  const validate = useCallback((values: RegisterFormValues) => {
    const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
    if (values.nombre.trim().length < 2) errors.nombre = 'Ingresa tu nombre completo.';
    if (!values.email.includes('@')) errors.email = 'Ingresa un correo valido.';
    if (values.password.length < 6) errors.password = 'Minimo 6 caracteres.';
    return errors;
  }, []);

  const form = useForm<RegisterFormValues>(
    { nombre: '', email: '', password: '', telefono: '', direccion: '', rol: 'USER' },
    validate
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid) return;
    setError('');
    try {
      await register({
        nombre: form.values.nombre,
        email: form.values.email,
        password: form.values.password,
        telefono: form.values.telefono || undefined,
        direccion: form.values.direccion || undefined,
        rol: form.values.rol
      });
      notify('Cuenta creada. Ahora inicia sesion.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card narrow" onSubmit={submit}>
        <h1>Crear cuenta</h1>
        <p className="muted">Registrate para empezar a vender o administrar Sellio.</p>
        <FormField
          label="Nombre completo"
          name="nombre"
          value={form.values.nombre}
          onChange={(e) => form.setField('nombre', e.target.value)}
          error={form.touched.nombre ? form.errors.nombre : undefined}
        />
        <FormField
          label="Correo"
          name="email"
          type="email"
          value={form.values.email}
          onChange={(e) => form.setField('email', e.target.value)}
          error={form.touched.email ? form.errors.email : undefined}
        />
        <FormField
          label="Contrasena"
          name="password"
          type="password"
          value={form.values.password}
          onChange={(e) => form.setField('password', e.target.value)}
          error={form.touched.password ? form.errors.password : undefined}
          hint="Minimo 6 caracteres."
        />
        <div className="field-row">
          <FormField
            label="Telefono (opcional)"
            name="telefono"
            value={form.values.telefono}
            onChange={(e) => form.setField('telefono', e.target.value)}
          />
          <FormField
            label="Direccion (opcional)"
            name="direccion"
            value={form.values.direccion}
            onChange={(e) => form.setField('direccion', e.target.value)}
          />
        </div>
        <FormSelect
          label="Tipo de cuenta"
          name="rol"
          value={form.values.rol}
          onChange={(e) => form.setField('rol', e.target.value as Rol)}
          hint="Administrador puede gestionar productos, inventario y ver todas las ventas/compras."
        >
          <option value="USER">Usuario (vendedor)</option>
          <option value="ADMIN">Administrador</option>
        </FormSelect>
        {error && <div className="inline-error">{error}</div>}
        <button className="button button-primary button-block" disabled={loading || !form.isValid}>
          <UserPlus size={18} /> {loading ? 'Creando' : 'Registrarme'}
        </button>
        <p className="muted">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </form>
    </main>
  );
}
