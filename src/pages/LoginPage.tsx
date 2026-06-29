import { useCallback, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const { notify } = useToast();
  const [error, setError] = useState('');
  const validate = useCallback((values: { email: string; password: string }) => {
    const errors: Partial<Record<keyof typeof values, string>> = {};
    if (!values.email.includes('@')) errors.email = 'Ingresa un correo valido.';
    if (values.password.length < 6) errors.password = 'Minimo 6 caracteres.';
    return errors;
  }, []);
  const form = useForm({ email: '', password: '' }, validate);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid) return;
    setError('');
    const controller = new AbortController();
    try {
      await login({ email: form.values.email, password: form.values.password }, controller.signal);
      notify('Sesion iniciada correctamente.', 'success');
      navigate((location.state as { from?: { pathname: string } })?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="brand-mark">S</span>
          <h1>Sellio</h1>
          <p>Gestiona productos, inventario, ventas y compras desde un panel conectado al backend del proyecto.</p>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <h2>Iniciar sesion</h2>
          <FormField label="Correo" name="email" type="email" value={form.values.email} onChange={(e) => form.setField('email', e.target.value)} error={form.touched.email ? form.errors.email : undefined} />
          <FormField label="Contrasena" name="password" type="password" value={form.values.password} onChange={(e) => form.setField('password', e.target.value)} error={form.touched.password ? form.errors.password : undefined} />
          {error && <div className="inline-error">{error}</div>}
          <button className="button button-primary" disabled={loading || !form.isValid}>
            <LogIn size={18} /> {loading ? 'Ingresando' : 'Entrar'}
          </button>
          <p className="muted">No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
        </form>
      </section>
    </main>
  );
}
