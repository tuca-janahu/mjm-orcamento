import {
  integrationComplexities,
  webPlatformDataMigrationLevels,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { WebPlatformBudgetFormValues } from "./config";
import { platformOptionLabel } from "./config";
import { FieldError, SectionHeading } from "../budget-form-ui";

export function IntegrationsSection() {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WebPlatformBudgetFormValues>();
  const {
    fields: integrationFields,
    append: appendIntegration,
    remove: removeIntegration,
  } = useFieldArray({
    control,
    name: "inputData.integrations",
  });
  const dataMigration = watch("inputData.dataMigration");

  useEffect(() => {
    if (dataMigration === "NONE") {
      setValue("inputData.dataMigrationSourceCount", 0, {
        shouldValidate: true,
      });
    }
  }, [dataMigration, setValue]);

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="04"
        title="Integrações e dados"
        description="Registre serviços externos e o esforço necessário para trazer dados existentes."
      />
      <div className="grid gap-7">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-xs font-semibold">Integrações</h3>
              <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
                Descreva cada sistema externo de forma independente.
              </p>
            </div>
            <button
              className={ui.secondaryAction}
              disabled={integrationFields.length >= 20}
              type="button"
              onClick={() =>
                appendIntegration({
                  name: "",
                  description: undefined,
                  complexity: "STANDARD",
                })
              }
            >
              Adicionar integração
            </button>
          </div>
          {integrationFields.length === 0 && (
            <p className="m-0 border border-dashed border-zinc-300 px-4 py-5 text-center text-xs text-zinc-500">
              Nenhuma integração adicionada.
            </p>
          )}
          {integrationFields.map((field, index) => (
            <div
              className="grid grid-cols-1 items-start gap-4 border border-zinc-200 bg-zinc-50 p-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.2fr)_160px_auto]"
              key={field.id}
            >
              <label className={ui.field}>
                <span>Nome da integração</span>
                <input
                  className={ui.input}
                  placeholder="Ex.: ERP ou gateway de pagamento"
                  {...register(`inputData.integrations.${index}.name`)}
                />
                <FieldError
                  message={
                    errors.inputData?.integrations?.[index]?.name?.message
                  }
                />
              </label>
              <label className={ui.field}>
                <span>Descrição opcional</span>
                <input
                  className={ui.input}
                  placeholder="Objetivo e dados envolvidos"
                  {...register(`inputData.integrations.${index}.description`, {
                    setValueAs: (value: string) =>
                      value.trim() === "" ? undefined : value,
                  })}
                />
                <FieldError
                  message={
                    errors.inputData?.integrations?.[index]?.description
                      ?.message
                  }
                />
              </label>
              <label className={ui.field}>
                <span>Complexidade</span>
                <select
                  className={ui.input}
                  {...register(`inputData.integrations.${index}.complexity`)}
                >
                  {integrationComplexities.map((value) => (
                    <option value={value} key={value}>
                      {platformOptionLabel(value)}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={
                    errors.inputData?.integrations?.[index]?.complexity?.message
                  }
                />
              </label>
              <button
                className={`${ui.secondaryAction} mt-4 lg:mt-3.5`}
                type="button"
                onClick={() => removeIntegration(index)}
              >
                Remover
              </button>
            </div>
          ))}
          <FieldError message={errors.inputData?.integrations?.root?.message} />
        </div>

        <div className={`${ui.formGrid} border-t border-zinc-200 pt-5`}>
          <label className={ui.field}>
            <span>Migração de dados</span>
            <select
              className={ui.input}
              {...register("inputData.dataMigration")}
            >
              {webPlatformDataMigrationLevels.map((value) => (
                <option value={value} key={value}>
                  {platformOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.dataMigration?.message} />
          </label>
          {dataMigration !== "NONE" && (
            <label className={ui.field}>
              <span>Fontes de dados</span>
              <input
                className={ui.input}
                type="number"
                min="1"
                max="20"
                {...register("inputData.dataMigrationSourceCount", {
                  valueAsNumber: true,
                })}
              />
              <FieldError
                message={errors.inputData?.dataMigrationSourceCount?.message}
              />
            </label>
          )}
        </div>
      </div>
    </section>
  );
}
