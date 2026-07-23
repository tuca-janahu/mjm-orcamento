import { integrationComplexities } from "@mjm/shared";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { InternalSystemBudgetFormValues } from "./config";
import { internalSystemOptionLabel } from "./config";
import { FieldError, SectionHeading } from "../budget-form-ui";

export function StructureSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InternalSystemBudgetFormValues>();
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control,
    name: "inputData.modules",
  });
  const minimumTargetLaunchDate = new Date().toISOString().slice(0, 10);

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="01"
        title="Estrutura do sistema"
        description="Defina as capacidades de negócio, os perfis de acesso e a data desejada de entrega."
      />
      <div className="grid gap-7">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-xs font-semibold">Módulos</h3>
              <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
                Liste capacidades independentes do sistema, não telas.
              </p>
            </div>
            <button
              className={ui.secondaryAction}
              disabled={moduleFields.length >= 20}
              type="button"
              onClick={() =>
                appendModule({
                  name: "",
                  description: undefined,
                  complexity: "STANDARD",
                })
              }
            >
              Adicionar módulo
            </button>
          </div>

          {moduleFields.map((field, index) => (
            <div
              className="grid grid-cols-1 items-start gap-4 border border-zinc-200 bg-zinc-50 p-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.2fr)_160px_auto]"
              key={field.id}
            >
              <label className={ui.field}>
                <span>Nome do módulo</span>
                <input
                  className={ui.input}
                  maxLength={120}
                  placeholder="Ex.: Controle de estoque"
                  {...register(`inputData.modules.${index}.name`)}
                />
                <FieldError
                  message={errors.inputData?.modules?.[index]?.name?.message}
                />
              </label>
              <label className={ui.field}>
                <span>Descrição opcional</span>
                <input
                  className={ui.input}
                  maxLength={1_000}
                  placeholder="Resumo do que está incluído"
                  {...register(`inputData.modules.${index}.description`, {
                    setValueAs: (value: string) =>
                      value.trim() === "" ? undefined : value,
                  })}
                />
                <FieldError
                  message={
                    errors.inputData?.modules?.[index]?.description?.message
                  }
                />
              </label>
              <label className={ui.field}>
                <span>Complexidade</span>
                <select
                  className={ui.input}
                  {...register(`inputData.modules.${index}.complexity`)}
                >
                  {integrationComplexities.map((value) => (
                    <option value={value} key={value}>
                      {internalSystemOptionLabel(value)}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={
                    errors.inputData?.modules?.[index]?.complexity?.message
                  }
                />
              </label>
              <button
                aria-label={`Remover módulo ${index + 1}`}
                className={`${ui.secondaryAction} mt-4 lg:mt-3.5`}
                disabled={moduleFields.length === 1}
                type="button"
                onClick={() => removeModule(index)}
              >
                Remover
              </button>
            </div>
          ))}
          <FieldError message={errors.inputData?.modules?.root?.message} />
        </div>

        <div className={`${ui.formGrid} border-t border-zinc-200 pt-5`}>
          <label className={ui.field}>
            <span>Perfis de acesso</span>
            <input
              aria-label="Perfis de acesso"
              className={ui.input}
              type="number"
              min="1"
              max="20"
              {...register("inputData.accessProfileCount", {
                valueAsNumber: true,
              })}
            />
            <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
              Quantidade de perfis de acesso, como administrador, gestor,
              operador ou consulta. Não representa a quantidade de usuários.
            </small>
            <FieldError
              message={errors.inputData?.accessProfileCount?.message}
            />
          </label>
          <label className={ui.field}>
            <span>Data desejada de lançamento</span>
            <input
              aria-label="Data desejada de lançamento"
              className={ui.input}
              type="date"
              min={minimumTargetLaunchDate}
              {...register("inputData.targetLaunchDate", {
                setValueAs: (value: string) =>
                  value === "" ? undefined : value,
              })}
            />
            <FieldError
              message={errors.inputData?.targetLaunchDate?.message}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
