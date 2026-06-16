interface GlobalLoaderProps {
  message?: string;
  exiting?: boolean;
}

export function GlobalLoader({ message = 'Procesando...', exiting = false }: GlobalLoaderProps) {
  return (
    <div
      className={`gl-overlay${exiting ? ' gl-overlay--exiting' : ''}`}
      role="status"
      aria-live="assertive"
      aria-label={message}
    >
      <div className="gl-card">
        <div className="gl-brand">
          <img src="/Logo-ungrd-blanco.png" alt="UNGRD" className="gl-brand__logo-img" />
          <span className="gl-brand__divider" aria-hidden="true" />
          <span className="gl-brand__title">Oficina Asesora de Planeación e Información</span>
        </div>

        <div className="gl-loader-media" aria-hidden="true">
          <img src="/Loader_MIRA.gif" alt="" className="gl-loader-gif" />
        </div>

        <div className="gl-progress-track" aria-hidden="true">
          <div className="gl-progress-bar" />
        </div>
      </div>
    </div>
  );
}
