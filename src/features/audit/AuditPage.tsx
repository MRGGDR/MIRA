import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { actionQueries } from '@/features/actions/api/actionQueries';

export function AuditPage() {
  const auditQuery = useQuery(actionQueries.audit());

  if (auditQuery.isLoading) return <LoadingState label="Cargando historial..." />;
  if (auditQuery.isError) return <ErrorMessage error={auditQuery.error} />;
  if (!auditQuery.data) return <ErrorMessage error={new Error('No se recibio historial.')} />;

  return (
    <div className="stack">
      <PageHeader title="Historial" description="Cambios registrados por Apps Script." />
      <section className="card card__body">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Operacion</th>
                <th>Numero</th>
                <th>Datos modificados</th>
              </tr>
            </thead>
            <tbody>
              {auditQuery.data.map((record) => (
                <tr key={`${record.timestamp}-${record.accionId}-${record.operacion}`}>
                  <td>{record.timestamp}</td>
                  <td>{record.usuario}</td>
                  <td>{record.operacion}</td>
                  <td>{record.accionId}</td>
                  <td className="truncate">{record.datosNuevosJson}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
