import {
  internalSystemAuthenticationFeatures,
  internalSystemDocumentManagementLevels,
  internalSystemPermissionModels,
  internalSystemWorkflowLevels,
} from "@mjm/shared";
import { useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { InternalSystemBudgetFormValues } from "./config";
import { internalSystemOptionLabel } from "./config";
import { FieldError, SectionHeading } from "../budget-form-ui";
import { CheckboxGrid } from "./form-ui";

export function AccessProcessesSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<InternalSystemBudgetFormValues>();
  const selectedAuthentication = watch("inputData.additionalAuthentication");
  const workflowLevel = watch("inputData.workflowLevel");
  const modules = watch("inputData.modules");

  function toggleAuthentication(
    value: (typeof internalSystemAuthenticationFeatures)[number],
  ): void {
    setValue(
      "inputData.additionalAuthentication",
      selectedAuthentication.includes(value)
        ? selectedAuthentication.filter((item) => item !== value)
        : [...selectedAuthentication, value],
      { shouldDirty: true, shouldValidate: true },
    );
  }

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="02"
        title="Acesso e processos"
        description="Configure permissões, autenticação adicional e processos transversais do sistema."
      />
      <div className="grid gap-7">
        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>Modelo de permissões</span>
            <select
              aria-label="Modelo de permissões"
              className={ui.input}
              {...register("inputData.permissionModel")}
            >
              {internalSystemPermissionModels.map((value) => (
                <option value={value} key={value}>
                  {internalSystemOptionLabel(value)}
                </option>
              ))}
            </select>
            <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
              Permissões padrão por perfil estão incluídas. Use permissões
              personalizadas somente para matrizes ou regras adicionais.
            </small>
            <FieldError
              message={errors.inputData?.permissionModel?.message}
            />
          </label>
          <label className={ui.field}>
            <span>Workflow global</span>
            <select
              aria-label="Workflow global"
              className={ui.input}
              {...register("inputData.workflowLevel")}
            >
              {internalSystemWorkflowLevels.map((value) => (
                <option value={value} key={value}>
                  {internalSystemOptionLabel(value)}
                </option>
              ))}
            </select>
            <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
              Utilize um workflow global apenas quando o processo atravessar
              mais de um módulo. Para fluxos restritos a um módulo, ajuste a
              complexidade do próprio módulo.
            </small>
            <FieldError message={errors.inputData?.workflowLevel?.message} />
          </label>
        </div>

        {workflowLevel !== "NONE" && modules.length === 1 && (
          <div
            className="border-l-[3px] border-amber-500 bg-amber-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-amber-900"
            role="alert"
          >
            Utilize um workflow global quando o processo atravessar mais de um
            módulo. Para um fluxo restrito a um único módulo, considere refletir
            o esforço na complexidade do próprio módulo.
          </div>
        )}

        <div className="grid gap-3 border-t border-zinc-200 pt-5">
          <div>
            <h3 className="m-0 text-xs font-semibold">
              Autenticação adicional
            </h3>
            <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
              E-mail e senha já estão incluídos na base.
            </p>
          </div>
          <CheckboxGrid>
            {internalSystemAuthenticationFeatures.map((feature) => (
              <label className={ui.checkOption} key={feature}>
                <input
                  className="peer absolute h-px w-px opacity-0"
                  type="checkbox"
                  checked={selectedAuthentication.includes(feature)}
                  onChange={() => toggleAuthentication(feature)}
                />
                <span className={ui.checkMark} />
                <span>{internalSystemOptionLabel(feature)}</span>
              </label>
            ))}
          </CheckboxGrid>
          <FieldError
            message={
              errors.inputData?.additionalAuthentication?.root?.message
            }
          />
        </div>

        <label className={`${ui.field} border-t border-zinc-200 pt-5`}>
          <span>Arquivos e documentos</span>
          <select
            aria-label="Arquivos e documentos"
            className={ui.input}
            {...register("inputData.documentManagement")}
          >
            {internalSystemDocumentManagementLevels.map((value) => (
              <option value={value} key={value}>
                {internalSystemOptionLabel(value)}
              </option>
            ))}
          </select>
          <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
            Anexos básicos permitem anexar e baixar arquivos. Fluxo documental
            inclui versionamento, aprovação ou controle de documentos.
          </small>
          <FieldError
            message={errors.inputData?.documentManagement?.message}
          />
        </label>
      </div>
    </section>
  );
}
