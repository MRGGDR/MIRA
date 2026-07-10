import { Info, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { CurrentUser } from '@/features/actions/types';
import { getProcessName } from '@/config/processes';

interface AccessContextBannerProps {
  user: CurrentUser | null;
  surface: 'dashboard' | 'reportar';
}

const roleCapabilities: Record<string, string[]> = {
  ADMIN: ['Ve todos los procesos.', 'Puede crear, editar y revisar cualquier fase.', 'Puede apoyar o corregir registros de otras areas.'],
  CREADOR: ['Puede reportar hallazgos.', 'Edita registro, analisis de causas y actividades base.', 'Consulta solo registros de su proceso.'],
  REV: ['Gestiona acciones que llegan a revisión.', 'Diligencia ejecución y evidencia de las actividades.', 'Puede ver acciones en plan de acción de todos los procesos.'],
  VAL: ['Gestiona acciones que llegan a validación.', 'Diligencia validación de las actividades.', 'Consulta solo registros de su proceso.'],
  OCI: ['Gestiona acciones enviadas a OCI.', 'Evalúa la eficacia de la acción.', 'Consulta solo registros de su proceso.'],
  CONSULTA: ['Solo puede consultar información.', 'No puede crear ni editar reportes.', 'Consulta solo registros permitidos.'],
};

export function AccessContextBanner({ user, surface }: AccessContextBannerProps) {
  const [open, setOpen] = useState(false);
  const role = user?.rol ?? 'CONSULTA';
  const isAdmin = Boolean(user?.permissions.canAdmin);
  const hasGlobalProcessScope = Boolean(isAdmin || role === 'OCI' || role === 'REV');
  const processCode = hasGlobalProcessScope ? 'Todos' : user?.proceso || 'Sin proceso';
  const processLabel = hasGlobalProcessScope ? 'Todos los procesos' : `${processCode} - ${getProcessName(processCode)}`;
  const surfaceText = surface === 'dashboard' ? 'Dashboard' : 'Reportar';

  return (
    <>
      <button className="access-banner" type="button" onClick={() => setOpen(true)}>
        <span className="access-banner__icon">
          <ShieldCheck aria-hidden size={20} />
        </span>
        <span className="access-banner__content">
          <span className="access-banner__eyebrow">Vista filtrada por acceso</span>
          <strong>
            {surfaceText}: rol {role} · {processLabel}
          </strong>
          <small>
            {role === 'REV'
              ? 'Alcance global para acciones en plan de acción.'
              : hasGlobalProcessScope
                ? 'Alcance global de procesos.'
                : 'Solo estás viendo información de tu proceso y permisos de rol.'}
          </small>
        </span>
        <span className="access-banner__action">
          <Info aria-hidden size={16} />
          Ver permisos
        </span>
      </button>

      {open ? (
        <div className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-modal-title">
          <button className="access-modal__backdrop" type="button" aria-label="Cerrar información de permisos" onClick={() => setOpen(false)} />
          <section className="access-modal__card">
            <div className="access-modal__head">
              <div>
                <span className="access-banner__eyebrow">Contexto de acceso</span>
                <h3 id="access-modal-title">Que estas viendo y que puedes hacer</h3>
              </div>
              <button className="access-modal__close" type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>
                <X aria-hidden size={18} />
              </button>
            </div>

            <div className="access-modal__summary">
              <AccessFact label="Usuario" value={user?.nombre ?? 'Sesión activa'} />
              <AccessFact label="Rol" value={role} />
              <AccessFact label="Proceso" value={processLabel} />
              <AccessFact
                label="Alcance"
                value={role === 'REV' ? 'Acciones en plan de acción' : hasGlobalProcessScope ? 'Todos los registros' : 'Solo registros del proceso asignado'}
              />
            </div>

            <div className="access-modal__body">
              <div>
                <h4>Permisos del rol</h4>
                <ul>
                  {(roleCapabilities[role] ?? roleCapabilities.CONSULTA).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Filtro aplicado</h4>
                <p>
                  {role === 'REV'
                    ? 'Puedes ver acciones en plan de acción de todos los procesos. Las demás etapas siguen sujetas a los permisos del flujo.'
                    : hasGlobalProcessScope
                    ? 'No se aplica restriccion por proceso. Puedes ver y filtrar todos los registros.'
                    : `El sistema restringe automaticamente Dashboard, Reportar, detalle y edicion al proceso ${processCode}.`}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function AccessFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="access-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
