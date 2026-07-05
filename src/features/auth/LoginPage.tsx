import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Headphones, LockKeyhole, Lock, ShieldCheck, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLoader } from '@/context/LoaderContext';
import { useAuth } from '@/features/auth/AuthContext';

const SUPPORT_EMAIL = 'manolo.rey@gestiondelriesgo.gov.co';

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  icon: LucideIcon;
  id: string;
  label: string;
};

function FormField({ children, error, icon: Icon, id, label }: FormFieldProps) {
  return (
    <div className={`login-field ${error ? 'login-field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="login-input-wrap">
        <Icon aria-hidden size={20} />
        {children}
      </div>
      {error ? <span className="login-field__error">{error}</span> : null}
    </div>
  );
}

function LoginCard() {
  const { login } = useAuth();
  const { show, hide } = useLoader();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showIdentifierError = submitted && !identifier.trim();
  const showPasswordError = submitted && !password.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError('');

    if (!identifier.trim() || !password.trim()) return;

    setIsSubmitting(true);
    show('Iniciando sesión...');
    try {
      await login(identifier, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar sesión.');
    } finally {
      setIsSubmitting(false);
      hide();
    }
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-card__emblem">
        <img src="/mano_ungrd.png" alt="" aria-hidden="true" />
      </div>

      <header className="login-card__header">
        <h1 id="login-title">Ingresar a MIRA</h1>
        <p>Accede con el usuario asignado</p>
        <span className="login-card__tricolor" aria-hidden="true" />
      </header>

      <form className="login-form" onSubmit={(event) => void submit(event)} noValidate>
        <FormField
          error={showIdentifierError ? 'Ingresa tu usuario.' : undefined}
          icon={User}
          id="login-user"
          label="Usuario"
        >
          <input
            id="login-user"
            aria-invalid={showIdentifierError}
            autoComplete="username"
            placeholder="Ingresa tu usuario"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </FormField>

        <FormField
          error={showPasswordError ? 'Ingresa tu contraseña.' : undefined}
          icon={LockKeyhole}
          id="login-password"
          label="Contraseña"
        >
          <input
            id="login-password"
            aria-invalid={showPasswordError}
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="login-password-toggle"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
          </button>
        </FormField>

        <div className="login-form__meta">
          <label className="login-checkbox" htmlFor="login-show-password">
            <input
              id="login-show-password"
              checked={showPassword}
              type="checkbox"
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            <span>Mostrar contraseña</span>
          </label>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Recuperar%20acceso%20MIRA`}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error ? <p className="login-error">{error}</p> : null}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          <Lock aria-hidden size={22} />
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="login-secure">
        <span aria-hidden="true" />
        <p>
          <ShieldCheck aria-hidden size={18} />
          Conexión segura y encriptada
        </p>
        <span aria-hidden="true" />
      </div>

      <div className="login-support">
        <Headphones aria-hidden size={22} />
        <span>
          Soporte: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </span>
      </div>
    </section>
  );
}

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  return (
    <main className="login-page">
      <a className="login-page__brand" href="/" aria-label="UNGRD - MIRA">
        <img src="/Logo-ungrd-blanco.png" alt="UNGRD" />
        <span className="login-page__brand-divider" aria-hidden="true" />
        <span className="login-page__brand-office">Oficina Asesora de Planeación e Información</span>
      </a>

      <section className="login-access-panel" aria-label="Inicio de sesión">
        <div className="login-access-panel__content">
          <LoginCard />

          <footer className="login-footer">
            <strong>Oficina Asesora de Planeación e Información © 2026</strong>
            <span>Todos los derechos reservados</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
