import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ExternalLink, Eye, Lock, PencilLine, Plus, Save, Trash2, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch, type FieldErrors, type FieldPath, type SubmitHandler, type UseFormRegister } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FeedbackMessage } from '@/components/feedback/FeedbackMessage';
import { getProcessNamesForAccess, isLegacyProcessCode, PROCESS_LEADERS, PROCESSES } from '@/config/processes';
import { actionSchema, type ActionFormValues } from '@/features/actions/schemas/actionSchema';
import type { CurrentUser, Parameters } from '@/features/actions/types';
import { todayIso } from '@/utils/date';
import { optionIdentity, uniqueOptionSorted } from '@/utils/format';

interface ActionFormProps {
  mode: 'create' | 'edit';
  initialValues: ActionFormValues;
  parameters?: Parameters;
  currentUser?: CurrentUser | null;
  isSaving: boolean;
  onSubmit: (values: ActionFormValues) => void;
}

type DynamicSectionName = 'equipoMejoramientoDetalle' | 'causasDefinitivas' | 'planMejoramiento';
type FieldName = Exclude<keyof ActionFormValues, DynamicSectionName>;
type FormPhase = 'registro' | 'analisis' | 'plan' | 'validacion' | 'oci';
type PhaseAccess = 'editable' | 'readonly' | 'locked';

interface FieldConfig {
  name: FieldName;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'datalist';
  options?: string[];
  full?: boolean;
  required?: boolean;
  hidden?: boolean;
}

export function ActionForm({ mode, initialValues, parameters, currentUser, isSaving, onSubmit }: ActionFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setFocus,
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: initialValues,
  });

  const planFieldArray = useFieldArray({ control, name: 'planMejoramiento' });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const isAdmin = Boolean(currentUser?.permissions.canAdmin);
  const hasGlobalProcessScope = Boolean(isAdmin || currentUser?.rol === 'OCI');
  const scopedProcesses = hasGlobalProcessScope ? [] : getProcessNamesForAccess(currentUser?.proceso ?? '');
  const originOptions = uniqueOptionSorted(parameters?.origenes ?? []);
  const selectedType = useWatch({ control, name: 'tipoAccion' }) ?? '';
  const normalizedType = selectedType.toLowerCase();
  const isImprovement = normalizedType.includes('mejora');
  const typeOptions = (parameters?.tiposAccion ?? []).filter((option) => !option.toLowerCase().includes('preventiva'));
  const processOptions = scopedProcesses.length
    ? scopedProcesses
    : uniqueOptionSorted(
        [...(parameters?.procesos ?? []), ...PROCESSES.map((item) => item.name)].filter(
          (option) => !isLegacyProcessCode(option) && optionIdentity(option) !== 'otro proceso',
        ),
      );
  const peopleOptions = parameters?.personas ?? [];
  const leaderOptions = uniqueOptionSorted(
    [...(parameters?.lideresProceso ?? []), ...PROCESS_LEADERS].filter((option) => optionIdentity(option) !== 'lider del proceso'),
  );
  const siplagOptions = parameters?.lideresSiplag ?? [];
  const currentRole = currentUser?.rol;
  const currentState = initialValues.estadoActual;
  const isCreator = currentRole === 'CREADOR';
  const isCreatorCreate = mode === 'create' && isCreator && Boolean(currentUser?.permissions.canCreate);

  const canEditPhase = (phase: FormPhase) => {
    if (isAdmin) return true;
    const isCreatorPhaseOnCreate = isCreatorCreate && (phase === 'registro' || phase === 'analisis' || phase === 'plan');
    const phaseIsActive =
      mode === 'create'
        ? phase === 'registro' || phase === 'analisis'
        : (phase === 'registro' && currentState === 'REGISTRO') ||
          (phase === 'analisis' && currentState === 'ANALISIS') ||
          (phase === 'plan' && currentState === 'PLAN_ACCION') ||
          (phase === 'validacion' && currentState === 'VALIDACION') ||
          (phase === 'oci' && currentState === 'REVISION_OCI');
    if (isCreatorPhaseOnCreate) return true;
    const permissions = currentUser?.permissions;
    return phaseIsActive && Boolean(
      (phase === 'registro' && permissions?.canEditRegistro) ||
        (phase === 'analisis' && permissions?.canEditAnalisis) ||
        (phase === 'plan' && permissions?.canEditPlan) ||
        (phase === 'validacion' && permissions?.canEditValidacion) ||
        (phase === 'oci' && permissions?.canEditOci),
    );
  };
  const canEditPlanDefinition =
    isAdmin || (isCreator && (mode === 'create' || currentState === 'REGISTRO' || currentState === 'ANALISIS'));
  const canEditPlanExecution =
    isAdmin || (mode === 'edit' && currentState === 'PLAN_ACCION' && Boolean(currentUser?.permissions.canEditPlan));
  const canEditPlanValidation =
    isAdmin || (mode === 'edit' && currentState === 'VALIDACION' && Boolean(currentUser?.permissions.canEditValidacion));
  const canEditAnyPlanField = canEditPlanDefinition || canEditPlanExecution || canEditPlanValidation;
  const canAddOrRemoveActivities = canEditPlanDefinition && (!initialValues.fechasBloqueadas || isAdmin);
  const showExecutionFields =
    isAdmin || (mode === 'edit' && ['PLAN_ACCION', 'VALIDACION', 'REVISION_OCI', 'CERRADA'].includes(currentState));
  const showValidationFields =
    isAdmin || (mode === 'edit' && ['VALIDACION', 'REVISION_OCI', 'CERRADA'].includes(currentState));
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [validationMessage, setValidationMessage] = useState('');
  const [pendingSubmitValues, setPendingSubmitValues] = useState<ActionFormValues | null>(null);

  const phaseOrder: FormPhase[] = ['registro', 'analisis', 'plan', 'validacion', 'oci'];
  const phaseIndex = phaseOrder.reduce<Record<FormPhase, number>>((acc, phase, index) => {
    acc[phase] = index;
    return acc;
  }, {} as Record<FormPhase, number>);
  const currentPhase = stateToPhase(initialValues.estadoActual);
  const reachedPhaseIndex =
    mode === 'create'
      ? isImprovement
        ? phaseIndex.registro
        : phaseIndex.analisis
      : initialValues.estadoActual === 'CERRADA'
        ? phaseIndex.oci
        : phaseIndex[currentPhase];
  const hasRegisteredActivities = initialValues.planMejoramiento.some(
    (activity) => activity.actividad || activity.responsable || activity.fechaApertura || activity.fechaCierre,
  );

  const getPhaseAccess = (phase: FormPhase): PhaseAccess => {
    if (phase === 'plan') {
      if (canEditAnyPlanField) return 'editable';
      if (phaseIndex[phase] <= reachedPhaseIndex || hasRegisteredActivities) return 'readonly';
      return 'locked';
    }
    const isEditable = canEditPhase(phase);
    if (isEditable) return 'editable';
    if (phaseIndex[phase] <= reachedPhaseIndex) return 'readonly';
    return 'locked';
  };

  const sections: Array<{ title: string; phase: FormPhase; hidden?: boolean; fields: FieldConfig[] }> = [
    {
      title: 'A. Descripcion del hallazgo',
      phase: 'registro',
      fields: [
        { name: 'id', label: 'Numero de la accion', type: 'number' },
        { name: 'fechaElaboracion', label: 'Fecha de elaboracion', type: 'date', required: true },
        { name: 'origen', label: 'Origen', type: 'select', options: originOptions, required: true },
        { name: 'tipoAccion', label: 'Tipo de accion', type: 'select', options: typeOptions, required: true },
        { name: 'proceso', label: 'Proceso o subproceso', type: 'select', options: processOptions, required: true },
        { name: 'identificadoPor', label: 'Registrado por', type: 'datalist', options: peopleOptions },
        { name: 'liderProceso', label: 'Lider del proceso', type: 'select', options: leaderOptions },
        { name: 'descripcion', label: 'Descripcion', type: 'textarea', full: true, required: true },
      ],
    },
    {
      title: 'B. Analisis de causas',
      phase: 'analisis',
      hidden: isImprovement,
      fields: [
        { name: 'identificacionCausas', label: 'Identificacion de causas', type: 'textarea', full: true },
        { name: 'causaRaiz', label: 'Causa raiz', type: 'textarea', full: true },
        { name: 'accionContencion', label: 'Accion de contencion', type: 'textarea', full: true },
      ],
    },
    {
      title: 'D. Evaluacion de la accion',
      phase: 'oci',
      hidden: mode === 'create' && !isAdmin,
      fields: [
        { name: 'auditorInterno', label: 'Evaluador', type: 'text' },
        { name: 'fechaEvaluacion', label: 'Fecha de evaluacion', type: 'date' },
        { name: 'eficacia', label: 'Las acciones fueron eficaces', type: 'select', options: ['', 'SI', 'NO'] },
        { name: 'evaluacionObservacion', label: 'Observacion de la accion', type: 'textarea', full: true },
      ],
    },
  ];

  const isSectionOpen = (key: string, access: PhaseAccess) => openSections[key] ?? access === 'editable';

  const toggleSection = (key: string, access: PhaseAccess) => {
    if (access === 'locked') return;
    setOpenSections((current) => ({ ...current, [key]: !(current[key] ?? access === 'editable') }));
  };

  const submitHandler: SubmitHandler<ActionFormValues> = (values) => {
    setValidationMessage('');
    setPendingSubmitValues(syncLegacyPlanFields(values));
  };

  function confirmSave() {
    if (!pendingSubmitValues) return;
    onSubmit(pendingSubmitValues);
    setPendingSubmitValues(null);
  }

  const invalidSubmitHandler = (formErrors: FieldErrors<ActionFormValues>) => {
    const messages = collectErrorMessages(formErrors);
    const firstEditableError = findFirstEditableErrorField(formErrors, sections.filter((section) => !section.hidden));
    setValidationMessage(
      messages.length
        ? `Revisa los campos pendientes: ${messages.slice(0, 4).join(' ')}`
        : 'Revisa los campos obligatorios antes de guardar.',
    );
    setOpenSections((current) => ({
      ...current,
      ...getSectionsToOpenForErrors(formErrors, sections.filter((section) => !section.hidden)),
      'plan-detail': Boolean(formErrors.planMejoramiento) || current['plan-detail'],
    }));
    window.setTimeout(() => {
      document.querySelector('.feedback-message--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstEditableError) setFocus(firstEditableError);
    }, 0);
  };

  function cancel() {
    if (!isDirty || window.confirm('Hay cambios sin guardar. Desea salir?')) {
      void navigate(-1);
    }
  }

  return (
    <form className="stack" noValidate onSubmit={(event) => void handleSubmit(submitHandler, invalidSubmitHandler)(event)}>
      {validationMessage ? (
        <FeedbackMessage type="error" title="No se pudo guardar" message={validationMessage} />
      ) : null}
      <div className="phase-legend" aria-label="Guia de permisos del formulario">
        <LegendItem access="editable" />
        <LegendItem access="readonly" />
        <LegendItem access="locked" />
      </div>
      {sections.filter((section) => !section.hidden).map((section) => (
        <PhaseAccordion
          key={section.title}
          access={getPhaseAccess(section.phase)}
          isOpen={isSectionOpen(section.title, getPhaseAccess(section.phase))}
          onToggle={() => toggleSection(section.title, getPhaseAccess(section.phase))}
          phase={section.phase}
          title={section.title}
        >
          <div className="form-grid">
            {section.fields.filter((field) => !field.hidden).map((field) => {
              const access = getPhaseAccess(section.phase);
              return (
                <FormField
                  key={field.name}
                  field={field}
                  mode={mode}
                  error={errors[field.name]?.message}
                  register={register}
                  disabled={access !== 'editable' || (field.name === 'proceso' && scopedProcesses.length === 1)}
                />
              );
            })}
          </div>
        </PhaseAccordion>
      ))}

      <PhaseAccordion
        access={getPhaseAccess('plan')}
        isOpen={isSectionOpen('plan-detail', getPhaseAccess('plan'))}
        onToggle={() => toggleSection('plan-detail', getPhaseAccess('plan'))}
        phase="plan"
        title="C. Plan de actividades"
      >
      <div className="form-dynamic-section">
        <DynamicSectionHeader
          description="Agrega la cantidad de actividades que necesites."
          onAdd={() =>
            planFieldArray.append({
              actividad: '',
              fechaApertura: todayIso(),
              fechaCierre: '',
              presupuesto: 0,
              responsable: '',
              revisionResponsable: '',
              revisionFecha: '',
              revisionObservacion: '',
              validacionResponsable: '',
              validacionFecha: '',
              validacionObservacion: '',
              evidencia: '',
            })
          }
          disabled={!canAddOrRemoveActivities}
        />
        <div className="dynamic-plan-grid">
          {planFieldArray.fields.length ? (
            planFieldArray.fields.map((field, index) => (
              <article className="dynamic-plan-card" key={field.id}>
                <div className="dynamic-plan-card__head">
                  <strong>Actividad {index + 1}</strong>
                  <button className="button button--ghost form-row-remove" type="button" disabled={!canAddOrRemoveActivities} onClick={() => planFieldArray.remove(index)}>
                    <Trash2 aria-hidden size={16} />
                    Quitar
                  </button>
                </div>
                <div className="form-grid">
                  <NestedTextArea label="Actividad" name={`planMejoramiento.${index}.actividad`} register={register} disabled={!canEditPlanDefinition} full />
                  <NestedInput label="Fecha inicio actividad" name={`planMejoramiento.${index}.fechaApertura`} register={register} disabled={!canEditPlanDefinition} type="date" />
                  <NestedInput label="Fecha fin actividad" name={`planMejoramiento.${index}.fechaCierre`} register={register} disabled={!canEditPlanDefinition} type="date" />
                  <NestedInput
                    label="Responsable de actividad"
                    name={`planMejoramiento.${index}.responsable`}
                    register={register}
                    type="text"
                    disabled={!canEditPlanDefinition}
                  />
                  {showExecutionFields ? (
                    <>
                      <EvidenceUrlField index={index} register={register} disabled={!canEditPlanExecution} />
                      <NestedInput
                        label="Fecha ejecucion"
                        name={`planMejoramiento.${index}.revisionFecha`}
                        register={register}
                        type="date"
                        disabled={!canEditPlanExecution}
                      />
                      <NestedTextArea
                        label="Descripcion de la ejecucion"
                        name={`planMejoramiento.${index}.revisionObservacion`}
                        register={register}
                        disabled={!canEditPlanExecution}
                        full
                      />
                    </>
                  ) : null}
                  {showValidationFields ? (
                    <>
                      <NestedInput
                        label="Responsable validacion"
                        listId="plan-siplag-options"
                        name={`planMejoramiento.${index}.validacionResponsable`}
                        register={register}
                        type="text"
                        disabled={!canEditPlanValidation}
                      />
                      <NestedInput
                        label="Fecha validacion"
                        name={`planMejoramiento.${index}.validacionFecha`}
                        register={register}
                        disabled={!canEditPlanValidation}
                        type="date"
                      />
                      <NestedTextArea
                        label="Observacion validacion"
                        name={`planMejoramiento.${index}.validacionObservacion`}
                        register={register}
                        disabled={!canEditPlanValidation}
                        full
                      />
                    </>
                  ) : null}
                </div>
                <NestedErrors errors={errors} index={index} />
              </article>
            ))
          ) : (
            <p className="empty-dynamic-note">Sin actividades registradas. Usa Agregar para crear la primera actividad.</p>
          )}
        </div>
        <datalist id="plan-siplag-options">
          {siplagOptions.map((option) => <option key={option} value={option} />)}
        </datalist>
      </div>
      </PhaseAccordion>

      <div className="actions-row">
        <button className="button button--primary" type="submit" disabled={isSaving}>
          <Save aria-hidden size={18} />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="button button--secondary" type="button" onClick={cancel}>
          <X aria-hidden size={18} />
          Cancelar
        </button>
      </div>
      {pendingSubmitValues ? (
        <SaveConfirmationModal
          isSaving={isSaving}
          role={currentRole ?? 'CONSULTA'}
          activityCount={pendingSubmitValues.planMejoramiento.filter((activity) => activity.actividad || activity.responsable).length}
          onCancel={() => setPendingSubmitValues(null)}
          onConfirm={confirmSave}
        />
      ) : null}
    </form>
  );
}

function SaveConfirmationModal({
  isSaving,
  role,
  activityCount,
  onCancel,
  onConfirm,
}: {
  isSaving: boolean;
  role: string;
  activityCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="save-modal" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
      <button className="save-modal__backdrop" type="button" aria-label="Cancelar guardado" disabled={isSaving} onClick={onCancel} />
      <section className="save-modal__card">
        <div className="save-modal__head">
          <span className="save-modal__icon">
            <Save aria-hidden size={20} />
          </span>
          <div>
            <h3 id="save-modal-title">Confirmar guardado</h3>
            <p>Revisa que toda la informacion este correcta antes de guardar.</p>
          </div>
        </div>
        <div className="save-modal__summary">
          <span>Rol: {role}</span>
          <span>Actividades: {activityCount}</span>
        </div>
        <div className="save-modal__actions">
          <button className="button button--secondary" type="button" disabled={isSaving} onClick={onCancel}>
            Cancelar
          </button>
          <button className="button button--primary" type="button" disabled={isSaving} onClick={onConfirm}>
            <Save aria-hidden size={18} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </section>
    </div>
  );
}

function stateToPhase(state: ActionFormValues['estadoActual']): FormPhase {
  if (state === 'ANALISIS') return 'analisis';
  if (state === 'PLAN_ACCION') return 'plan';
  if (state === 'VALIDACION') return 'validacion';
  if (state === 'REVISION_OCI' || state === 'CERRADA') return 'oci';
  return 'registro';
}

function collectErrorMessages(errors: unknown): string[] {
  const messages: string[] = [];
  if (Array.isArray(errors)) {
    errors.forEach((item) => messages.push(...collectErrorMessages(item)));
    return Array.from(new Set(messages));
  }
  if (!errors || typeof errors !== 'object') return [];
  if ('message' in errors) {
    const message = errors.message;
    if (typeof message === 'string') return [message];
    if (typeof message === 'number') return [String(message)];
  }
  Object.values(errors).forEach((error) => messages.push(...collectErrorMessages(error)));
  return Array.from(new Set(messages));
}

function getSectionsToOpenForErrors(
  errors: FieldErrors<ActionFormValues>,
  sections: Array<{ title: string; phase: FormPhase; fields: FieldConfig[] }>,
): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  sections.forEach((section) => {
    if (section.fields.some((field) => Boolean(errors[field.name]))) {
      open[section.title] = true;
    }
  });
  return open;
}

function findFirstEditableErrorField(
  errors: FieldErrors<ActionFormValues>,
  sections: Array<{ title: string; phase: FormPhase; fields: FieldConfig[] }>,
): FieldPath<ActionFormValues> | null {
  for (const section of sections) {
    const field = section.fields.find((item) => Boolean(errors[item.name]));
    if (field) return field.name;
  }
  return null;
}

function getPhaseLabel(phase: FormPhase) {
  const labels: Record<FormPhase, string> = {
    registro: 'Registro',
    analisis: 'Analisis',
    plan: 'Plan',
    validacion: 'Validacion',
    oci: 'OCI',
  };
  return labels[phase];
}

function getAccessMeta(access: PhaseAccess): { label: string; hint: string; Icon: LucideIcon } {
  if (access === 'editable') {
    return { label: 'Editable', hint: 'Puedes diligenciar esta fase', Icon: PencilLine };
  }
  if (access === 'readonly') {
    return { label: 'Solo lectura', hint: 'Disponible para revisar', Icon: Eye };
  }
  return { label: 'Bloqueada', hint: 'Se habilita en otra fase', Icon: Lock };
}

function syncLegacyPlanFields(values: ActionFormValues): ActionFormValues {
  const activities = values.planMejoramiento.map((activity) => ({
    ...activity,
    revisionResponsable: activity.responsable,
    evidencia: activity.evidencia ?? '',
  }));
  const firstActivity = activities.find((activity) => activity.actividad || activity.responsable || activity.fechaApertura || activity.fechaCierre);
  const lastEndDate = [...activities].reverse().find((activity) => activity.fechaCierre)?.fechaCierre ?? '';
  const totalBudget = activities.reduce((total, activity) => total + Number(activity.presupuesto || 0), 0);

  return {
    ...values,
    equipoMejoramiento: '',
    equipoMejoramientoDetalle: [],
    causasDefinitivas: [],
    correccion: '',
    accion: firstActivity?.actividad ?? values.accion,
    responsable: firstActivity?.responsable ?? values.responsable,
    fechaApertura: firstActivity?.fechaApertura ?? values.fechaApertura,
    fechaCierre: lastEndDate || firstActivity?.fechaCierre || values.fechaCierre,
    fechaInicioAccion: firstActivity?.fechaApertura ?? values.fechaInicioAccion,
    fechaFinAccion: lastEndDate || firstActivity?.fechaCierre || values.fechaFinAccion,
    presupuesto: totalBudget,
    revisionResponsable: firstActivity?.responsable ?? values.revisionResponsable,
    revisionFecha: firstActivity?.revisionFecha ?? values.revisionFecha,
    revisionObservacion: firstActivity?.revisionObservacion ?? values.revisionObservacion,
    validacionResponsable: firstActivity?.validacionResponsable ?? values.validacionResponsable,
    validacionFecha: firstActivity?.validacionFecha ?? values.validacionFecha,
    validacionObservacion: firstActivity?.validacionObservacion ?? values.validacionObservacion,
    evidencia: firstActivity?.evidencia ?? values.evidencia,
    recomendacionesFinales: '',
    planMejoramiento: activities,
  };
}

function PhaseAccordion({
  title,
  phase,
  access,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  phase: FormPhase;
  access: PhaseAccess;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { label, hint, Icon } = getAccessMeta(access);
  const canOpen = access !== 'locked';
  return (
    <section className={`phase-accordion phase-accordion--${access}`}>
      <button
        className="phase-accordion__trigger"
        type="button"
        aria-expanded={canOpen ? isOpen : false}
        disabled={!canOpen}
        onClick={onToggle}
      >
        <span className="phase-accordion__marker" aria-hidden>
          <Icon size={18} />
        </span>
        <span className="phase-accordion__main">
          <span className="phase-accordion__eyebrow">{getPhaseLabel(phase)}</span>
          <span className="phase-accordion__title">{title}</span>
        </span>
        <span className="phase-accordion__state">
          <span className="phase-accordion__badge">{label}</span>
          <span className="phase-accordion__hint">{hint}</span>
        </span>
        <ChevronDown className="phase-accordion__chevron" aria-hidden size={20} />
      </button>
      {canOpen && isOpen ? <div className="phase-accordion__body">{children}</div> : null}
    </section>
  );
}

function LegendItem({ access }: { access: PhaseAccess }) {
  const { label, hint, Icon } = getAccessMeta(access);
  return (
    <span className={`phase-legend__item phase-legend__item--${access}`}>
      <Icon aria-hidden size={15} />
      <strong>{label}</strong>
      <span>{hint}</span>
    </span>
  );
}

function DynamicSectionHeader({
  description,
  onAdd,
  disabled,
}: {
  description: string;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="form-dynamic-section__head">
      <div>
        <p className="muted">{description}</p>
      </div>
      <button className="button button--secondary" type="button" disabled={disabled} onClick={onAdd}>
        <Plus aria-hidden size={17} />
        Agregar
      </button>
    </div>
  );
}

function NestedInput({
  label,
  name,
  register,
  type,
  listId,
  valueAsNumber,
  disabled,
}: {
  label: string;
  name: `planMejoramiento.${number}.${keyof ActionFormValues['planMejoramiento'][number]}`;
  register: UseFormRegister<ActionFormValues>;
  type: 'text' | 'date' | 'number' | 'url';
  listId?: string;
  valueAsNumber?: boolean;
  disabled?: boolean;
}) {
  const id = name.replaceAll('.', '-');
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        list={listId}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 1 : undefined}
        type={type}
        disabled={disabled}
        {...register(name, valueAsNumber ? { valueAsNumber: true } : undefined)}
      />
    </div>
  );
}

function EvidenceUrlField({
  index,
  register,
  disabled,
}: {
  index: number;
  register: UseFormRegister<ActionFormValues>;
  disabled?: boolean;
}) {
  const name = `planMejoramiento.${index}.evidencia` as const;
  const id = name.replaceAll('.', '-');
  return (
    <div className="form-field form-field--full evidence-url-field">
      <div className="evidence-url-field__head">
        <label htmlFor={id}>URL de evidencia</label>
        <button className="button button--secondary evidence-url-field__button" type="button" disabled>
          <ExternalLink aria-hidden size={16} />
          Abrir Drive
        </button>
      </div>
      <p className="evidence-url-field__instructions">
        Abre el Drive, crea una carpeta con el numero de la accion, por ejemplo Acc_400. Dentro de esa carpeta crea una
        subcarpeta por cada actividad, por ejemplo Act_400_001. Copia y pega aqui la URL de la subcarpeta de la
        actividad, no la URL de la carpeta general.
      </p>
      <input id={id} type="url" placeholder="https://drive.google.com/..." disabled={disabled} {...register(name)} />
    </div>
  );
}

function NestedTextArea({
  label,
  name,
  register,
  full,
  disabled,
}: {
  label: string;
  name: `planMejoramiento.${number}.${keyof ActionFormValues['planMejoramiento'][number]}`;
  register: UseFormRegister<ActionFormValues>;
  full?: boolean;
  disabled?: boolean;
}) {
  const id = name.replaceAll('.', '-');
  return (
    <div className={`form-field ${full ? 'form-field--full' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} disabled={disabled} {...register(name)} />
    </div>
  );
}

function NestedErrors({ errors, index }: { errors: FieldErrors<ActionFormValues>; index: number }) {
  const activityErrors = errors.planMejoramiento?.[index];
  if (!activityErrors) return null;
  const messages = Object.values(activityErrors)
    .map((error) => (typeof error === 'object' && error && 'message' in error ? String(error.message) : ''))
    .filter(Boolean);
  if (!messages.length) return null;
  return (
    <div className="dynamic-errors">
      {messages.map((message, errorIndex) => (
        <span key={`${message}-${errorIndex}`}>{message}</span>
      ))}
    </div>
  );
}

interface FormFieldProps {
  field: FieldConfig;
  mode: 'create' | 'edit';
  error?: string;
  register: UseFormRegister<ActionFormValues>;
  disabled?: boolean;
}

function FormField({ field, mode, error, register, disabled: phaseDisabled }: FormFieldProps) {
  const id = `field-${field.name}`;
  const listId = `${id}-options`;
  const common = register(
    field.name,
    field.type === 'number'
      ? {
          setValueAs: (value) => (value === '' ? undefined : Number(value)),
        }
      : undefined,
  );
  const disabled = phaseDisabled || (field.name === 'estado' && mode === 'create');

  return (
    <div className={`form-field ${field.full ? 'form-field--full' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      {field.type === 'textarea' ? (
        <textarea id={id} disabled={disabled} {...common} />
      ) : field.type === 'select' ? (
        <select id={id} disabled={disabled} {...common}>
          {!field.required ? <option value="">Seleccione...</option> : null}
          {field.options?.map((option) => (
            <option key={option || 'empty'} value={option}>
              {option || 'Sin evaluar'}
            </option>
          ))}
        </select>
      ) : field.type === 'datalist' ? (
        <>
          <input id={id} list={listId} disabled={disabled} {...common} />
          <datalist id={listId}>
            {field.options?.map((option) => <option key={option} value={option} />)}
          </datalist>
        </>
      ) : (
        <input
          id={id}
          type={field.type}
          disabled={disabled}
          min={field.name === 'presupuesto' ? 0 : undefined}
          step={field.name === 'presupuesto' ? 1 : undefined}
          {...common}
        />
      )}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
