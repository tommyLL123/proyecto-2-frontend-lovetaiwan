import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <Compass size={40} />
      <span className="not-found-code">404</span>
      <h1>No encontramos esta pagina</h1>
      <p className="muted">La ruta que buscas no existe o fue movida.</p>
      <Link className="button button-primary" to="/">
        Volver al inicio
      </Link>
    </main>
  );
}
