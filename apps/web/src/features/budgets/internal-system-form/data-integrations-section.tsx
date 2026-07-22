import {
  integrationComplexities,
  internalSystemDataMigrationLevels,
  internalSystemNotificationChannels,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { InternalSystemBudgetFormValues } from "./config";
import { internalSystemOptionLabel } from "./config";
import { CheckboxGrid, FieldError, SectionHeading } from "./form-ui";

export function DataIntegrationsSection() {
  const {
    clearErrors,
    control,
    register,
    setValue,
    unregister,
    watch,
    formState: { errors },
  } = useFormContext<InternalSystemBudgetFormValues>();
  const {
    fields: integrationFields,
    append: appendIntegration,
    remove: removeIntegration,
  } = useFieldArray({
    control,
    name: "inputData.integrations",
  });
  const selectedNotifications = watch(
    "inputData.additionalNotificationChannels",
  );
  const dataMigration = watch("inputData.dataMigration");

  useEffect(() => {
    if (dataMigration !== "NONE") return;

    setValue("inputData.dataMigrationSourceCount", 0, {
      shouldValidate: true,
    });
    unregister("inputData.dataMigrationDescription");
    clearErrors([
      "inputData.dataMigrationSourceCount",
      "inputData.dataMigrationDescription",
    ]);
  }, [clearErrors, dataMigration, setValue, unregister]);

  function toggleNotification(
    value: (typeof internalSystemNotificationChannels)[number],
  ): void {
    setValue(
      "inputData.additionalNotificationChannels",
      selectedNotifications.includes(value)
        ? selectedNotifications.filter((item) => item !== value)
        : [...selectedNotifications, value],
      { shouldDirty: true, shouldValidate: true },
    );
  }

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="03"
        title="Dados e integrações"
        description="Dimensione as saídas operacionais, os serviços externos e a migração de dados existente."
      />
      <div className="grid gap-7">
        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>Dashboards</span>
            <input
              aria-label="Dashboards"
              className={ui.input}
              type="number"
              min="1"
              max="20"
              {...register("inputData.dashboardCount", {
                valueAsNumber: true,
              })}
            />
            <small className="text-[0.6875rem] font-normal tracking-normal text-zinc-500 normal-case">
              Um dashboard simples já está incluído na base.
            </small>
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
          <div>
            <h3 className="m-0 text-xs font-semibold">
              Canais adicionais de notificação
            </h3>
            <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
              Notificações dentro do sistema já estão incluídas.
            </p>
          </div>
          <CheckboxGrid>
            {internalSystemNotificationChannels.map((channel) => (
              <label className={ui.checkOption} key={channel}>
                <input
                  className="peer absolute h-px w-px opacity-0"
                  type="checkbox"
                  checked={selectedNotifications.includes(channel)}
                  onChange={() => toggleNotification(channel)}
                />
                <span className={ui.checkMark} />
                <span>{internalSystemOptionLabel(channel)}</span>
              </label>
            ))}
          </CheckboxGrid>
          <FieldError
            message={
              errors.inputData?.additionalNotificationChannels?.root?.message
            }
          />
          <p className="m-0 text-[0.6875rem] leading-relaxed text-zinc-500">
            Custos de consumo de e-mail, WhatsApp, SMS, SSO ou outros
            fornecedores externos não estão incluídos, salvo indicação
            expressa.
          </p>
        </div>

        <div className="grid gap-3 border-t border-zinc-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-xs font-semibold">Integrações</h3>
              <p className="mt-1 mb-0 text-[0.6875rem] text-zinc-500">
                Sistemas externos com os quais o Sistema Interno trocará dados.
              </p>
            </div>
            <button
              className={ui.secondaryAction}
              disabled={integrationFields.length >= 10}
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
                  maxLength={120}
                  placeholder="Ex.: ERP corporativo"
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
                  maxLength={1_000}
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
                      {internalSystemOptionLabel(value)}
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
                aria-label={`Remover integração ${index + 1}`}
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
              {internalSystemDataMigrationLevels.map((value) => (
                <option value={value} key={value}>
                  {internalSystemOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.dataMigration?.message} />
          </label>
          {dataMigration !== "NONE" && (
            <>
              <label className={ui.field}>
                <span>Fontes de dados</span>
                <input
                  aria-label="Fontes de dados"
                  className={ui.input}
                  type="number"
                  min="1"
                  max="20"
                  {...register("inputData.dataMigrationSourceCount", {
                    valueAsNumber: true,
                  })}
                />
                <FieldError
                  message={
                    errors.inputData?.dataMigrationSourceCount?.message
                  }
                />
              </label>
              <label className={`${ui.field} sm:col-span-2`}>
                <span>Descrição das fontes</span>
                <textarea
                  aria-label="Descrição das fontes"
                  className={ui.textarea}
                  maxLength={1_000}
                  placeholder="Ex.: Planilha de estoque em Excel e banco do sistema legado"
                  rows={3}
                  {...register("inputData.dataMigrationDescription", {
                    setValueAs: (value: string) =>
                      value.trim() === "" ? undefined : value,
                  })}
                />
                <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
                  Informe resumidamente as planilhas, bancos ou sistemas de
                  origem.
                </small>
                <FieldError
                  message={errors.inputData?.dataMigrationDescription?.message}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
