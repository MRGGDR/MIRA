import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Eye, Lock, PencilLine, Plus, Save, Trash2, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch, type FieldErrors, type SubmitHandler, type UseFormRegister } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PROCESSES } from '@/config/processes';
import { actionSchema, type ActionFormValues } from '@/features/actions/schemas/actionSchema';
import type { CurrentUser, Parameters } from '@/features/actions/types';
import { uniqueOptionSorted } from '@/utils/format';

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
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: initialValues,
  });

  const teamFieldArray = useFieldArray({ control, name: 'equipoMejoramientoDetalle' });
  const causesFieldArray = useFieldArray({ control, name: 'causasDefinitivas' });
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

  const scopedProcess = currentUser?.permissions.canAdmin ? '' : (currentUser?.proceso ?? '');
  const originOptions = uniqueOptionSorted(parameters?.origenes ?? []);
  const selectedType = useWatch({ control, name: 'tipoAccion' }) ?? '';
  const normalizedType = selectedType.toLowerCase();
  const isImprovement = normalizedType.includes('mejora');
  const isCorrective = normalizedType.includes('correctiva');
  const typeOptions = (parameters?.tiposAccion ?? []).filter((option) => !option.toLowerCase().includes('preventiva'));
  const processOptions = scopedProcess
    ? [scopedProcess]
    : uniqueOptionSorted(parameters?.procesos?.length ? parameters.procesos : PROCESSES.map((item) => item.code));
  const peopleOptions = parameters?.personas ?? [];
  const leaderOptions = parameters?.lideresProceso ?? [];
  const siplagOptions = parameters?.lideresSiplag ?? [];
  const auditorOptions = parameters?.auditores ?? [];
  const isOperationalUser = Boolean(currentUser?.rol && currentUser.rol !== 'CONSULTA' && currentUser.rol !== 'ANONIMO');

  const canEditPhase = (phase: FormPhase) => {
    const currentState = initialValues.estadoActual;
    const isCreatorPhaseOnCreate = mode === 'create' && isOperationalUser && (phase === 'registro' || phase === 'analisis');
    const phaseIsActive =
      mode === 'create'
        ? phase === 'registro' || phase === 'analisis'
        : (phase === 'registro' && currentState === 'REGISTRO') ||
          (phase === 'analisis' && currentState === 'ANALISIS') ||
          (phase === 'plan' && currentState === 'PLAN_ACCION') ||
          (phase === 'validacion' && currentState === 'VALIDACION') ||
          (phase === 'oci' && currentState === 'REVISION_OCI');
    if (isCreatorPhaseOnCreate) return true;
    if (currentUser?.permissions.canAdmin) return phaseIsActive;
    const permissions = currentUser?.permissions;
    return phaseIsActive && Boolean(
      (phase === 'registro' && permissions?.canEditRegistro) ||
        (phase === 'analisis' && permissions?.canEditAnalisis) ||
        (phase === 'plan' && permissions?.canEditPlan) ||
        (phase === 'validacion' && permissions?.canEditValidacion) ||
        (phase === 'oci' && permissions?.canEditOci),
    );
  };
  const canEditAnalysis = canEditPhase('analisis');
  const canEditPlan = canEditPhase('plan') && !initialValues.fechasBloqueadas;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  const getPhaseAccess = (phase: FormPhase): PhaseAccess => {
    const isEditable = canEditPhase(phase) && !(phase === 'plan' && initialValues.fechasBloqueadas);
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
        { name: 'identificadoPor', label: 'Identificado por', type: 'datalist', options: peopleOptions },
        { name: 'liderProceso', label: 'Lider del proceso', type: 'datalist', options: leaderOptions },
        { name: 'descripcion', label: 'Descripcion', type: 'textarea', full: true, required: true },
      ],
    },
    {
      title: 'B. Analisis de causas',
      phase: 'analisis',
      hidden: isImprovement,
      fields: [
        { name: 'equipoMejoramiento', label: 'Equipo de mejoramiento', type: 'textarea', full: true },
        { name: 'identificacionCausas', label: 'Identificacion de causas', type: 'textarea', full: true },
        { name: 'causaRaiz', label: 'Causa raiz', type: 'textarea', full: true },
        { name: 'correccion', label: 'Correccion', type: 'textarea', full: true },
        { name: 'accionContencion', label: 'Accion de contencion', type: 'textarea', full: true, required: isCorrective, hidden: !isCorrective },
      ],
    },
    {
      title: 'C. Plan de actividades',
      phase: 'plan',
      fields: [
        { name: 'accion', label: 'Accion', type: 'textarea', full: true, required: true },
        { name: 'responsable', label: 'Responsable', type: 'datalist', options: peopleOptions },
        { name: 'fechaApertura', label: 'Fecha de apertura', type: 'date' },
        { name: 'fechaCierre', label: 'Fecha de cierre', type: 'date' },
        { name: 'fechaInicioAccion', label: 'Fecha inicio accion', type: 'date' },
        { name: 'fechaFinAccion', label: 'Fecha fin accion', type: 'date' },
        { name: 'presupuesto', label: 'Presupuesto', type: 'number' },
      ],
    },
    {
      title: 'Revision y validacion',
      phase: 'validacion',
      fields: [
        { name: 'revisionResponsable', label: 'Responsable revision', type: 'datalist', options: siplagOptions },
        { name: 'revisionFecha', label: 'Fecha ejecucion revision', type: 'date' },
        { name: 'revisionObservacion', label: 'Observacion revision', type: 'textarea', full: true },
        { name: 'validacionResponsable', label: 'Responsable validacion', type: 'datalist', options: siplagOptions },
        { name: 'validacionFecha', label: 'Fecha ejecucion validacion', type: 'date' },
        { name: 'validacionObservacion', label: 'Observacion validacion', type: 'textarea', full: true },
        { name: 'evidencia', label: 'Evidencia', type: 'textarea', full: true },
      ],
    },
    {
      title: 'D. Evaluacion de las acciones',
      phase: 'oci',
      fields: [
        { name: 'auditorInterno', label: 'Auditor interno', type: 'datalist', options: auditorOptions },
        { name: 'fechaEvaluacion', label: 'Fecha de evaluacion', type: 'date' },
        { name: 'eficacia', label: 'Las acciones fueron eficaces', type: 'select', options: ['', 'SI', 'NO'] },
        { name: 'evaluacionObservacion', label: 'Observacion evaluacion', type: 'textarea', full: true },
        { name: 'recomendacionesFinales', label: 'Recomendaciones finales', type: 'textarea', full: true },
      ],
    },
  ];

  const isSectionOpen = (key: string, access: PhaseAccess) => openSections[key] ?? access === 'editable';

  const toggleSection = (key: string, access: PhaseAccess) => {
    if (access === 'locked') return;
    setOpenSections((current) => ({ ...current, [key]: !(current[key] ?? access === 'editable') }));
  };

  const submitHandler: SubmitHandler<ActionFormValues> = (values) => {
    onSubmit(values);
  };

  function cancel() {
    if (!isDirty || window.confirm('Hay cambios sin guardar. Desea salir?')) {
      void navigate(-1);
    }
  }

  return (
    <form className="stack" onSubmit={(event) => void handleSubmit(submitHandler)(event)}>
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
                  disabled={access !== 'editable' || (field.name === 'proceso' && Boolean(scopedProcess))}
                />
              );
            })}
          </div>
        </PhaseAccordion>
      ))}

      {!isImprovement ? (
      <PhaseAccordion
        access={getPhaseAccess('analisis')}
        isOpen={isSectionOpen('team-detail', getPhaseAccess('analisis'))}
        onToggle={() => toggleSection('team-detail', getPhaseAccess('analisis'))}
        phase="analisis"
        title="Miembros del Equipo de Mejoramiento Continuo"
      >
      <div className="form-dynamic-section">
        <DynamicSectionHeader
          description="Registra integrantes, previas y votacion como aparece en el seguimiento impreso."
          onAdd={() => teamFieldArray.append({ nombre: '', previas: '', votacion: '' })}
          disabled={!canEditAnalysis}
        />
        <div className="table-wrap form-table-wrap">
          <table className="data-table form-edit-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Previas</th>
                <th>Votacion</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {teamFieldArray.fields.length ? (
                teamFieldArray.fields.map((field, index) => (
                  <tr key={field.id}>
                    <td>
                      <input
                        aria-label={`Nombre integrante ${index + 1}`}
                        list="team-member-options"
                        disabled={!canEditAnalysis}
                        {...register(`equipoMejoramientoDetalle.${index}.nombre`)}
                      />
                    </td>
                    <td>
                      <input aria-label={`Previas integrante ${index + 1}`} disabled={!canEditAnalysis} {...register(`equipoMejoramientoDetalle.${index}.previas`)} />
                    </td>
                    <td>
                      <input aria-label={`Votacion integrante ${index + 1}`} disabled={!canEditAnalysis} {...register(`equipoMejoramientoDetalle.${index}.votacion`)} />
                    </td>
                    <td>
                      <button className="button button--ghost form-row-remove" type="button" disabled={!canEditAnalysis} onClick={() => teamFieldArray.remove(index)}>
                        <Trash2 aria-hidden size={16} />
                        <span className="sr-only">Quitar integrante</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyDynamicRow colSpan={4} label="Sin integrantes detallados." />
              )}
            </tbody>
          </table>
          <datalist id="team-member-options">
            {peopleOptions.map((option) => <option key={option} value={option} />)}
          </datalist>
        </div>
      </div>
      </PhaseAccordion>
      ) : null}

      {!isImprovement ? (
      <PhaseAccordion
        access={getPhaseAccess('analisis')}
        isOpen={isSectionOpen('causes-detail', getPhaseAccess('analisis'))}
        onToggle={() => toggleSection('causes-detail', getPhaseAccess('analisis'))}
        phase="analisis"
        title="Definicion de Causas Definitivas"
      >
      <div className="form-dynamic-section">
        <DynamicSectionHeader
          description="Permite registrar causas finales con votos y puntaje."
          onAdd={() => causesFieldArray.append({ causa: '', descripcion: '', votos: 0, puntaje: 0 })}
          disabled={!canEditAnalysis}
        />
        <div className="table-wrap form-table-wrap">
          <table className="data-table form-edit-table">
            <thead>
              <tr>
                <th>Causa</th>
                <th>Descripcion</th>
                <th>Votos</th>
                <th>Puntaje</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {causesFieldArray.fields.length ? (
                causesFieldArray.fields.map((field, index) => (
                  <tr key={field.id}>
                    <td>
                      <input aria-label={`Causa definitiva ${index + 1}`} disabled={!canEditAnalysis} {...register(`causasDefinitivas.${index}.causa`)} />
                    </td>
                    <td>
                      <textarea aria-label={`Descripcion causa definitiva ${index + 1}`} disabled={!canEditAnalysis} {...register(`causasDefinitivas.${index}.descripcion`)} />
                    </td>
                    <td>
                      <input
                        aria-label={`Votos causa definitiva ${index + 1}`}
                        min={0}
                        type="number"
                        disabled={!canEditAnalysis}
                        {...register(`causasDefinitivas.${index}.votos`, { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Puntaje causa definitiva ${index + 1}`}
                        min={0}
                        step="0.01"
                        type="number"
                        disabled={!canEditAnalysis}
                        {...register(`causasDefinitivas.${index}.puntaje`, { valueAsNumber: true })}
                      />
                    </td>
                    <td>
                      <button className="button button--ghost form-row-remove" type="button" disabled={!canEditAnalysis} onClick={() => causesFieldArray.remove(index)}>
                        <Trash2 aria-hidden size={16} />
                        <span className="sr-only">Quitar causa</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyDynamicRow colSpan={5} label="Sin causas definitivas detalladas." />
              )}
            </tbody>
          </table>
        </div>
      </div>
      </PhaseAccordion>
      ) : null}

      <PhaseAccordion
        access={getPhaseAccess('plan')}
        isOpen={isSectionOpen('plan-detail', getPhaseAccess('plan'))}
        onToggle={() => toggleSection('plan-detail', getPhaseAccess('plan'))}
        phase="plan"
        title="Plan de Mejoramiento"
      >
      <div className="form-dynamic-section">
        <DynamicSectionHeader
          description="Agrega una o varias actividades con revision y validacion por actividad."
          onAdd={() =>
            planFieldArray.append({
              actividad: '',
              fechaApertura: '',
              fechaCierre: '',
              presupuesto: 0,
              responsable: '',
              revisionResponsable: '',
              revisionFecha: '',
              revisionObservacion: '',
              validacionResponsable: '',
              validacionFecha: '',
              validacionObservacion: '',
            })
          }
          disabled={!canEditPlan}
        />
        <div className="dynamic-plan-grid">
          {planFieldArray.fields.length ? (
            planFieldArray.fields.map((field, index) => (
              <article className="dynamic-plan-card" key={field.id}>
                <div className="dynamic-plan-card__head">
                  <strong>Actividad {index + 1}</strong>
                  <button className="button button--ghost form-row-remove" type="button" disabled={!canEditPlan} onClick={() => planFieldArray.remove(index)}>
                    <Trash2 aria-hidden size={16} />
                    Quitar
                  </button>
                </div>
                <div className="form-grid">
                  <NestedTextArea label="Actividad" name={`planMejoramiento.${index}.actividad`} register={register} disabled={!canEditPlan} full />
                  <NestedInput label="Apertura" name={`planMejoramiento.${index}.fechaApertura`} register={register} disabled={!canEditPlan} type="date" />
                  <NestedInput label="Cierre" name={`planMejoramiento.${index}.fechaCierre`} register={register} disabled={!canEditPlan} type="date" />
                  <NestedInput
                    label="Presupuesto"
                    name={`planMejoramiento.${index}.presupuesto`}
                    register={register}
                    type="number"
                    disabled={!canEditPlan}
                    valueAsNumber
                  />
                  <NestedInput
                    label="Responsable"
                    listId="plan-people-options"
                    name={`planMejoramiento.${index}.responsable`}
                    register={register}
                    type="text"
                    disabled={!canEditPlan}
                  />
                  <NestedInput
                    label="Responsable revision"
                    listId="plan-siplag-options"
                    name={`planMejoramiento.${index}.revisionResponsable`}
                    register={register}
                    type="text"
                    disabled={!canEditPlan}
                  />
                  <NestedInput label="Fecha revision" name={`planMejoramiento.${index}.revisionFecha`} register={register} disabled={!canEditPlan} type="date" />
                  <NestedTextArea label="Observacion revision" name={`planMejoramiento.${index}.revisionObservacion`} register={register} disabled={!canEditPlan} full />
                  <NestedInput
                    label="Responsable validacion"
                    listId="plan-siplag-options"
                    name={`planMejoramiento.${index}.validacionResponsable`}
                    register={register}
                    type="text"
                    disabled={!canEditPlan}
                  />
                  <NestedInput label="Fecha validacion" name={`planMejoramiento.${index}.validacionFecha`} register={register} disabled={!canEditPlan} type="date" />
                  <NestedTextArea label="Observacion validacion" name={`planMejoramiento.${index}.validacionObservacion`} register={register} disabled={!canEditPlan} full />
                </div>
                <NestedErrors errors={errors} index={index} />
              </article>
            ))
          ) : (
            <p className="empty-dynamic-note">Sin actividades detalladas. Puedes agregar actividades para registrar varios controles Rev/Val.</p>
          )}
        </div>
        <datalist id="plan-people-options">
          {peopleOptions.map((option) => <option key={option} value={option} />)}
        </datalist>
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
    </form>
  );
}

function stateToPhase(state: ActionFormValues['estadoActual']): FormPhase {
  if (state === 'ANALISIS') return 'analisis';
  if (state === 'PLAN_ACCION') return 'plan';
  if (state === 'VALIDACION') return 'validacion';
  if (state === 'REVISION_OCI' || state === 'CERRADA') return 'oci';
  return 'registro';
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

function EmptyDynamicRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td className="empty-dynamic-cell" colSpan={colSpan}>
        {label}
      </td>
    </tr>
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
  type: 'text' | 'date' | 'number';
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
  const common = register(field.name, field.type === 'number' ? { valueAsNumber: true } : undefined);
  const disabled = phaseDisabled || field.name === 'id' || (field.name === 'estado' && mode === 'create');

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
