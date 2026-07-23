import {
  integrationComplexities,
  webPlatformBackofficeLevels,
  webPlatformDesignApproaches,
} from "@mjm/shared";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { WebPlatformBudgetFormValues } from "./config";
import { platformOptionLabel } from "./config";
import { FieldError, SectionHeading } from "../budget-form-ui";

export function ProductSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<WebPlatformBudgetFormValues>();
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control,
    name: "inputData.functionalModules",
  });

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="02"
        title="Produto e experiência"
        description="Dimensione o design, os módulos funcionais e as áreas de gestão e análise."
      />
      <div className="grid gap-7">
        <div className={ui.formGridThree}>
          <label className={ui.field}>
            <span>Abordagem de design</span>
            <select
              className={ui.input}
              {...register("inputData.designApproach")}
            >
              {webPlatformDesignApproaches.map((value) => (
                <option value={value} key={value}>
                  {platformOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.designApproach?.message} />
          </label>
          <label className={ui.field}>
            <span>Backoffice administrativo</span>
            <select
              className={ui.input}
              {...register("inputData.adminBackoffice")}
            >
              {webPlatformBackofficeLevels.map((value) => (
                <option value={value} key={value}>
                  {platformOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.adminBackoffice?.message} />
          </label>
          <label className={ui.field}>
            <span>Dashboards</span>
            <input
              className={ui.input}
              type="number"
              min="0"
              max="20"
              {...register("inputData.dashboardCount", {
                valueAsNumber: true,
              })}
            />
            <FieldError message={errors.inputData?.dashboardCount?.message} />
          </label>
          <label className={ui.field}>
            <span>Relatórios</span>
            <input
              className={ui.input}
              type="number"
              min="0"
              max="50"
              {...register("inputData.reportCount", { valueAsNumber: true })}
            />
            <FieldError message={errors.inputData?.reportCount?.message} />
          </label>
        </div>

        <div className="grid gap-3 border-t border-zinc-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-xs font-semibold">
                Módulos funcionais
              </h3>
              <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
                Liste as capacidades centrais, sem confundi-las com telas.
              </p>
            </div>
            <button
              className={ui.secondaryAction}
              disabled={moduleFields.length >= 30}
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
                  placeholder="Ex.: Gestão de assinaturas"
                  {...register(`inputData.functionalModules.${index}.name`)}
                />
                <FieldError
                  message={
                    errors.inputData?.functionalModules?.[index]?.name?.message
                  }
                />
              </label>
              <label className={ui.field}>
                <span>Descrição opcional</span>
                <input
                  className={ui.input}
                  placeholder="Resumo do que está incluído"
                  {...register(
                    `inputData.functionalModules.${index}.description`,
                    {
                      setValueAs: (value: string) =>
                        value.trim() === "" ? undefined : value,
                    },
                  )}
                />
                <FieldError
                  message={
                    errors.inputData?.functionalModules?.[index]?.description
                      ?.message
                  }
                />
              </label>
              <label className={ui.field}>
                <span>Complexidade</span>
                <select
                  className={ui.input}
                  {...register(
                    `inputData.functionalModules.${index}.complexity`,
                  )}
                >
                  {integrationComplexities.map((value) => (
                    <option value={value} key={value}>
                      {platformOptionLabel(value)}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={
                    errors.inputData?.functionalModules?.[index]?.complexity
                      ?.message
                  }
                />
              </label>
              <button
                className={`${ui.secondaryAction} mt-4 lg:mt-3.5`}
                disabled={moduleFields.length === 1}
                type="button"
                onClick={() => removeModule(index)}
              >
                Remover
              </button>
            </div>
          ))}
          <FieldError
            message={errors.inputData?.functionalModules?.root?.message}
          />
        </div>
      </div>
    </section>
  );
}
