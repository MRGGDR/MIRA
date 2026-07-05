import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Save, UserPlus, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { LoadingState } from '@/components/feedback/LoadingState';
import { PROCESSES } from '@/config/processes';
import type { CreateUserInput, ManagedUser, UpdateUserInput, UserRole } from '@/features/actions/types';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError, apiClient } from '@/services/apiClient';

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'CREADOR', 'REV', 'VAL', 'OCI', 'CONSULTA'];

const emptyForm: CreateUserInput = {
  email: '',
  nombre: '',
  proceso: '',
  rol: 'CONSULTA',
  password: '',
  activo: true,
};

type UserEditForm = UpdateUserInput & { password: string };

function userToEditForm(user: ManagedUser): UserEditForm {
  return {
    email: user.email,
    nombre: user.nombre,
    proceso: user.proceso,
    rol: user.rol,
    password: '',
    activo: user.activo,
  };
}

export function ConfigurationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [editingUser, setEditingUser] = useState<UserEditForm | null>(null);
  const [editSubmitted, setEditSubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: apiClient.listUsers,
    enabled: Boolean(user?.permissions.canAdmin),
  });
  const createUser = useMutation({
    mutationFn: apiClient.createUser,
    onSuccess: async () => {
      setForm(emptyForm);
      setSubmitted(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const updateUser = useMutation({
    mutationFn: apiClient.updateUser,
    onSuccess: async () => {
      setEditingUser(null);
      setEditSubmitted(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const processOptions = useMemo(() => PROCESSES.map((process) => process.name), []);
  const hasGlobalProcessScope = form.rol === 'ADMIN' || form.rol === 'OCI';
  const requiresProcess = form.rol !== 'ADMIN' && form.rol !== 'OCI' && form.rol !== 'CONSULTA';
  const usersEndpointMissing = usersQuery.error instanceof ApiClientError && usersQuery.error.code === 'UNKNOWN_ACTION';
  const missingIdentifier = submitted && !form.email.trim();
  const missingName = submitted && !form.nombre.trim();
  const missingPassword = submitted && !form.password.trim();
  const missingProcess = submitted && requiresProcess && !form.proceso.trim();

  if (!user?.permissions.canAdmin) return <Navigate to="/" replace />;

  function updateField<TKey extends keyof CreateUserInput>(field: TKey, value: CreateUserInput[TKey]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!form.email.trim() || !form.nombre.trim() || !form.password.trim() || (requiresProcess && !form.proceso.trim())) return;
    createUser.mutate({
      ...form,
      email: form.email.trim(),
      nombre: form.nombre.trim(),
      proceso: hasGlobalProcessScope ? '' : form.proceso.trim(),
      password: form.password,
    });
  }

  function updateEditField<TKey extends keyof UserEditForm>(field: TKey, value: UserEditForm[TKey]) {
    setEditingUser((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setEditSubmitted(true);
    const editHasGlobalProcessScope = editingUser.rol === 'ADMIN' || editingUser.rol === 'OCI';
    const editRequiresProcess = editingUser.rol !== 'ADMIN' && editingUser.rol !== 'OCI' && editingUser.rol !== 'CONSULTA';
    if (!editingUser.nombre.trim() || (editRequiresProcess && !editingUser.proceso.trim())) return;
    updateUser.mutate({
      email: editingUser.email,
      nombre: editingUser.nombre.trim(),
      proceso: editHasGlobalProcessScope ? '' : editingUser.proceso.trim(),
      rol: editingUser.rol,
      activo: editingUser.activo,
      ...(editingUser.password.trim() ? { password: editingUser.password } : {}),
    });
  }

  return (
    <div className="stack configuration-page">
      <PageHeader title="Configuracion" description="Administracion de usuarios y permisos de acceso." />

      <section className="card card__body">
        <div className="config-section-head">
          <div>
            <h3 className="section-title">Crear usuario</h3>
            <p className="muted">El usuario de ingreso corresponde al valor guardado en la columna email de la hoja Usuarios.</p>
          </div>
        </div>

        {createUser.isError ? <ErrorMessage error={createUser.error} /> : null}

        <form className="form-grid config-user-form" onSubmit={submit} noValidate>
          <div className="form-field">
            <label htmlFor="config-user-id">Usuario</label>
            <input
              id="config-user-id"
              aria-invalid={missingIdentifier}
              autoComplete="username"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
            {missingIdentifier ? <span className="field-error">Registre el usuario.</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="config-user-name">Nombre</label>
            <input
              id="config-user-name"
              aria-invalid={missingName}
              autoComplete="name"
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
            />
            {missingName ? <span className="field-error">Registre el nombre.</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="config-user-password">Contrasena</label>
            <input
              id="config-user-password"
              aria-invalid={missingPassword}
              autoComplete="new-password"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
            {missingPassword ? <span className="field-error">Registre la contrasena.</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="config-user-role">Rol</label>
            <select
              id="config-user-role"
              value={form.rol}
              onChange={(event) => updateField('rol', event.target.value as UserRole)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="config-user-process">Proceso</label>
            <select
              id="config-user-process"
              aria-invalid={missingProcess}
              disabled={hasGlobalProcessScope}
              value={hasGlobalProcessScope ? '' : form.proceso}
              onChange={(event) => updateField('proceso', event.target.value)}
            >
              <option value="">{hasGlobalProcessScope ? 'Todos los procesos' : 'Seleccione un proceso'}</option>
              {processOptions.map((process) => (
                <option key={process} value={process}>
                  {process}
                </option>
              ))}
            </select>
            {missingProcess ? <span className="field-error">Seleccione el proceso del usuario.</span> : null}
          </div>

          <label className="config-active-toggle" htmlFor="config-user-active">
            <input
              id="config-user-active"
              checked={form.activo}
              type="checkbox"
              onChange={(event) => updateField('activo', event.target.checked)}
            />
            <span>Usuario activo</span>
          </label>

          <div className="actions-row config-form-actions">
            <button className="button button--primary" type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? <Save aria-hidden size={18} /> : <UserPlus aria-hidden size={18} />}
              {createUser.isPending ? 'Guardando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      <section className="card card__body">
        <h3 className="section-title">Usuarios registrados</h3>
        {usersQuery.isLoading ? <LoadingState label="Cargando usuarios..." /> : null}
        {usersEndpointMissing ? (
          <div className="card card__body" role="alert">
            <strong>El Apps Script desplegado todavia no tiene el modulo de usuarios.</strong>
            <p className="muted">Vuelve a subir y desplegar los archivos de app_scripts para habilitar listar, crear y editar usuarios.</p>
          </div>
        ) : null}
        {usersQuery.isError && !usersEndpointMissing ? <ErrorMessage error={usersQuery.error} /> : null}
        {updateUser.isError ? <ErrorMessage error={updateUser.error} /> : null}
        {usersQuery.data ? (
          <div className="table-wrap">
            <table className="data-table config-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Proceso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((managedUser) => (
                  <UserRow
                    key={managedUser.email}
                    editSubmitted={editSubmitted}
                    editingUser={editingUser}
                    isSaving={updateUser.isPending}
                    processOptions={processOptions}
                    user={managedUser}
                    onCancel={() => {
                      setEditingUser(null);
                      setEditSubmitted(false);
                    }}
                    onEdit={() => {
                      setEditingUser(userToEditForm(managedUser));
                      setEditSubmitted(false);
                    }}
                    onSave={saveEdit}
                    onUpdate={updateEditField}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function UserRow({
  user,
  editingUser,
  processOptions,
  editSubmitted,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onUpdate,
}: {
  user: ManagedUser;
  editingUser: UserEditForm | null;
  processOptions: string[];
  editSubmitted: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <TKey extends keyof UserEditForm>(field: TKey, value: UserEditForm[TKey]) => void;
}) {
  const isEditing = editingUser?.email === user.email;
  const editHasGlobalProcessScope = Boolean(editingUser && (editingUser.rol === 'ADMIN' || editingUser.rol === 'OCI'));
  const editRequiresProcess = editingUser ? editingUser.rol !== 'ADMIN' && editingUser.rol !== 'OCI' && editingUser.rol !== 'CONSULTA' : false;
  const missingName = Boolean(isEditing && editSubmitted && !editingUser?.nombre.trim());
  const missingProcess = Boolean(isEditing && editSubmitted && editRequiresProcess && !editingUser?.proceso.trim());

  if (!isEditing || !editingUser) {
    return (
      <tr>
        <td>{user.email}</td>
        <td>{user.nombre}</td>
        <td>{user.rol}</td>
        <td>{user.proceso || 'Todos'}</td>
        <td>
          <span className={`user-status-pill ${user.activo ? 'user-status-pill--active' : 'user-status-pill--inactive'}`}>
            {user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button className="button button--secondary config-row-action" type="button" onClick={onEdit}>
            <Pencil aria-hidden size={16} />
            Editar
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="config-users-table__edit-row">
      <td>{editingUser.email}</td>
      <td>
        <form id={`edit-user-${editingUser.email}`} onSubmit={onSave} />
        <input
          aria-invalid={missingName}
          form={`edit-user-${editingUser.email}`}
          value={editingUser.nombre}
          onChange={(event) => onUpdate('nombre', event.target.value)}
        />
        {missingName ? <span className="field-error">Nombre obligatorio.</span> : null}
        <input
          autoComplete="new-password"
          form={`edit-user-${editingUser.email}`}
          placeholder="Nueva contrasena (opcional)"
          type="password"
          value={editingUser.password}
          onChange={(event) => onUpdate('password', event.target.value)}
        />
      </td>
      <td>
        <select
          form={`edit-user-${editingUser.email}`}
          value={editingUser.rol}
          onChange={(event) => onUpdate('rol', event.target.value as UserRole)}
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          aria-invalid={missingProcess}
          disabled={editHasGlobalProcessScope}
          form={`edit-user-${editingUser.email}`}
          value={editHasGlobalProcessScope ? '' : editingUser.proceso}
          onChange={(event) => onUpdate('proceso', event.target.value)}
        >
          <option value="">{editHasGlobalProcessScope ? 'Todos los procesos' : 'Seleccione'}</option>
          {processOptions.map((process) => (
            <option key={process} value={process}>
              {process}
            </option>
          ))}
        </select>
        {missingProcess ? <span className="field-error">Proceso obligatorio.</span> : null}
      </td>
      <td>
        <label className="config-active-toggle" htmlFor={`edit-active-${editingUser.email}`}>
          <input
            id={`edit-active-${editingUser.email}`}
            checked={editingUser.activo}
            form={`edit-user-${editingUser.email}`}
            type="checkbox"
            onChange={(event) => onUpdate('activo', event.target.checked)}
          />
          <span>Activo</span>
        </label>
      </td>
      <td>
        <div className="actions-row config-row-actions">
          <button className="button button--primary config-row-action" form={`edit-user-${editingUser.email}`} type="submit" disabled={isSaving}>
            <Save aria-hidden size={16} />
            Guardar
          </button>
          <button className="button button--secondary config-row-action" type="button" disabled={isSaving} onClick={onCancel}>
            <X aria-hidden size={16} />
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );
}
