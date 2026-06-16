export function ErrorMessage({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Ocurrio un error inesperado.';
  return (
    <div className="card card__body" role="alert">
      <strong>No fue posible completar la operacion.</strong>
      <p className="muted">{message}</p>
    </div>
  );
}
