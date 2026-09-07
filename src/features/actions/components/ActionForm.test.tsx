import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ActionForm } from '@/features/actions/components/ActionForm';
import type { CurrentUser } from '@/features/actions/types';
import { getDefaultActionValues } from '@/features/actions/utils/actionDefaults';

const adminUser: CurrentUser = {
  email: 'admin@example.com',
  nombre: 'Administrador',
  proceso: 'Gestión Gerencial',
  rol: 'ADMIN',
  permissions: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canAdmin: true,
  },
};

function roleUser(role: 'CREADOR' | 'REV' | 'VAL' | 'OCI'): CurrentUser {
  return {
    email: `${role.toLowerCase()}@example.com`,
    nombre: role,
    proceso: role === 'OCI' ? '' : 'Planeacion Estrategica',
    rol: role,
    permissions: {
      canRead: true,
      canCreate: role === 'CREADOR',
      canUpdate: true,
      canAdmin: false,
      canEditRegistro: role === 'CREADOR',
      canEditAnalisis: role === 'CREADOR',
      canEditPlan: role === 'REV',
      canEditValidacion: role === 'VAL',
      canEditOci: role === 'OCI',
      canNotifyOci: role === 'REV',
    },
  };
}

function editValues(state: 'PLAN_ACCION' | 'VALIDACION' | 'REVISION_OCI' = 'PLAN_ACCION') {
  const values = getDefaultActionValues('Planeacion Estrategica', 412);
  return {
    ...values,
    origen: 'Auditoria interna',
    tipoAccion: 'Accion correctiva',
    auditorInterno: 'OCI',
    liderProceso: 'Lider Uno',
    descripcion: 'Descripcion original',
    estadoActual: state,
    planMejoramiento: [
      {
        ...values.planMejoramiento[0],
        idActividad: '412-001',
        idAccion: 412,
        numeroActividad: 1,
        actividad: 'Actividad original',
        fechaApertura: '2026-09-01',
        fechaCierre: '2026-12-01',
        responsable: 'Responsable original',
        validacionResponsable: 'Lider Uno',
      },
    ],
  };
}

describe('ActionForm structured text editor', () => {
  it('saves on the first click and submits structured text with its line breaks intact', async () => {
    const onSubmit = vi.fn();
    const initialValues = {
      ...getDefaultActionValues('Gestión Gerencial'),
      origen: 'Auditoria interna',
      tipoAccion: 'Acción correctiva',
      auditorInterno: 'OCI',
      descripcion: 'Primera línea\nSegunda línea',
    };

    render(
      <MemoryRouter>
        <ActionForm
          mode="create"
          initialValues={initialValues}
          currentUser={adminUser}
          isSaving={false}
          onSubmit={onSubmit}
        />
      </MemoryRouter>,
    );

    const description = screen.getByLabelText<HTMLTextAreaElement>('Descripción *');
    description.setSelectionRange(0, description.value.length);
    const editor = description.closest<HTMLElement>('.structured-text-editor');
    if (!editor) throw new Error('No se encontró el editor estructurado de la descripción.');

    fireEvent.click(within(editor).getByRole('button', { name: 'Viñetas' }));

    expect(description).toHaveValue('• Primera línea\n• Segunda línea');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ descripcion: '• Primera línea\n• Segunda línea' }),
      ),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Confirmar guardado' })).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a save is still in progress', async () => {
    let finishSave: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        }),
    );
    const initialValues = {
      ...getDefaultActionValues('Gestion Gerencial'),
      origen: 'Auditoria interna',
      tipoAccion: 'Accion correctiva',
      auditorInterno: 'OCI',
      descripcion: 'Hallazgo',
    };

    render(
      <MemoryRouter>
        <ActionForm
          mode="create"
          initialValues={initialValues}
          currentUser={adminUser}
          isSaving={false}
          onSubmit={onSubmit}
        />
      </MemoryRouter>,
    );

    const save = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    finishSave?.();
  });
});

describe('ActionForm role field access', () => {
  it('allows REV review fields but not activity definitions or validation', () => {
    render(
      <MemoryRouter>
        <ActionForm
          mode="edit"
          initialValues={editValues('PLAN_ACCION')}
          currentUser={roleUser('REV')}
          isSaving={false}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Actividad')).toBeDisabled();
    expect(screen.getByLabelText('Responsable de actividad')).toBeDisabled();
    expect(screen.getByLabelText('URL de evidencia')).toBeEnabled();
    expect(screen.getByLabelText(/^Fecha ejecuci/)).toBeEnabled();
    expect(screen.getByLabelText(/de la ejecuci/)).toBeEnabled();
    expect(screen.queryByLabelText(/^Fecha validaci/)).not.toBeInTheDocument();
  });

  it('allows VAL validation only after REV completed the activity', () => {
    const values = editValues('VALIDACION');
    values.planMejoramiento[0].revisionFecha = '2026-09-05';
    values.planMejoramiento[0].revisionObservacion = 'Ejecutada';

    render(
      <MemoryRouter>
        <ActionForm
          mode="edit"
          initialValues={values}
          currentUser={roleUser('VAL')}
          isSaving={false}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Actividad')).toBeDisabled();
    expect(screen.getByLabelText('URL de evidencia')).toBeDisabled();
    expect(screen.getByLabelText(/^Fecha ejecuci/)).toBeDisabled();
    expect(screen.getByLabelText(/^Fecha validaci/)).toBeEnabled();
    expect(screen.getByLabelText('Fue validada la actividad?')).toBeEnabled();
  });

  it('locks REV execution fields once VAL has started validating the activity', () => {
    const values = editValues('VALIDACION');
    values.planMejoramiento[0].revisionFecha = '2026-09-05';
    values.planMejoramiento[0].revisionObservacion = 'Ejecutada';
    values.planMejoramiento[0].validacionFecha = '2026-09-06';
    values.planMejoramiento[0].validacionObservacion = 'SI';

    render(
      <MemoryRouter>
        <ActionForm
          mode="edit"
          initialValues={values}
          currentUser={roleUser('REV')}
          isSaving={false}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('URL de evidencia')).toBeDisabled();
    expect(screen.getByLabelText(/^Fecha ejecuci/)).toBeDisabled();
    expect(screen.getByLabelText(/de la ejecuci/)).toBeDisabled();
  });

  it('locks plan definitions for CREADOR after review work has begun', () => {
    const values = editValues('PLAN_ACCION');
    values.planMejoramiento[0].evidencia = 'https://drive.example/evidencia';

    render(
      <MemoryRouter>
        <ActionForm
          mode="edit"
          initialValues={values}
          currentUser={roleUser('CREADOR')}
          isSaving={false}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /C\. Plan de actividades/i }));
    expect(screen.getByLabelText('Actividad')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Quitar' })).toBeDisabled();
  });
});
