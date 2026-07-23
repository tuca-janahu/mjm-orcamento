import {
  webPlatformAuditLevels,
  webPlatformAuthenticationFeatures,
  webPlatformFileHandlingLevels,
  webPlatformNotificationChannels,
  webPlatformPaymentFeatures,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { WebPlatformBudgetFormValues } from "./config";
import { platformOptionLabel } from "./config";
import { FieldError, SectionHeading } from "../budget-form-ui";
import { CheckboxGrid } from "./form-ui";

export function ResourcesSection() {
  const {
    register,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WebPlatformBudgetFormValues>();
  const platformCategory = watch("inputData.platformCategory");
  const selectedAuthentication = watch("inputData.additionalAuthentication");
  const selectedPayments = watch("inputData.paymentFeatures");
  const selectedNotifications = watch("inputData.notificationChannels");

  useEffect(() => {
    const payments = getValues("inputData.paymentFeatures");
    if (
      platformCategory !== "MARKETPLACE" &&
      payments.includes("MARKETPLACE_SPLIT")
    ) {
      setValue(
        "inputData.paymentFeatures",
        payments.filter((value) => value !== "MARKETPLACE_SPLIT"),
        { shouldValidate: true },
      );
    }
  }, [getValues, platformCategory, setValue]);

  function toggleAuthentication(
    value: (typeof webPlatformAuthenticationFeatures)[number],
  ): void {
    setValue(
      "inputData.additionalAuthentication",
      selectedAuthentication.includes(value)
        ? selectedAuthentication.filter((item) => item !== value)
        : [...selectedAuthentication, value],
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function togglePayment(
    value: (typeof webPlatformPaymentFeatures)[number],
  ): void {
    setValue(
      "inputData.paymentFeatures",
      selectedPayments.includes(value)
        ? selectedPayments.filter((item) => item !== value)
        : [...selectedPayments, value],
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function toggleNotification(
    value: (typeof webPlatformNotificationChannels)[number],
  ): void {
    setValue(
      "inputData.notificationChannels",
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
        title="Acesso e recursos"
        description="Selecione os mecanismos de acesso, cobrança, comunicação, arquivos e auditoria."
      />
      <div className="grid gap-7">
        <div className="grid gap-3">
          <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase">
            Autenticação adicional
          </span>
          <CheckboxGrid>
            {webPlatformAuthenticationFeatures.map((feature) => (
              <label className={ui.checkOption} key={feature}>
                <input
                  type="checkbox"
                  checked={selectedAuthentication.includes(feature)}
                  onChange={() => toggleAuthentication(feature)}
                />
                <span>{platformOptionLabel(feature)}</span>
              </label>
            ))}
          </CheckboxGrid>
          <FieldError
            message={errors.inputData?.additionalAuthentication?.root?.message}
          />
        </div>

        <div className="grid gap-3">
          <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase">
            Pagamentos
          </span>
          <CheckboxGrid>
            {webPlatformPaymentFeatures.map((feature) => {
              const unavailable =
                feature === "MARKETPLACE_SPLIT" &&
                platformCategory !== "MARKETPLACE";
              return (
                <label
                  className={`${ui.checkOption} ${unavailable ? "cursor-not-allowed bg-zinc-50 text-zinc-400" : ""}`}
                  key={feature}
                >
                  <input
                    type="checkbox"
                    disabled={unavailable}
                    checked={selectedPayments.includes(feature)}
                    onChange={() => togglePayment(feature)}
                  />
                  <span>{platformOptionLabel(feature)}</span>
                </label>
              );
            })}
          </CheckboxGrid>
          <FieldError
            message={errors.inputData?.paymentFeatures?.root?.message}
          />
        </div>

        <div className="grid gap-3">
          <span className="text-[0.625rem] font-bold tracking-[0.1em] text-zinc-600 uppercase">
            Notificações
          </span>
          <CheckboxGrid>
            {webPlatformNotificationChannels.map((channel) => (
              <label className={ui.checkOption} key={channel}>
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(channel)}
                  onChange={() => toggleNotification(channel)}
                />
                <span>{platformOptionLabel(channel)}</span>
              </label>
            ))}
          </CheckboxGrid>
          <FieldError
            message={errors.inputData?.notificationChannels?.root?.message}
          />
        </div>

        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>Arquivos e documentos</span>
            <select
              className={ui.input}
              {...register("inputData.fileHandling")}
            >
              {webPlatformFileHandlingLevels.map((value) => (
                <option value={value} key={value}>
                  {platformOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.fileHandling?.message} />
          </label>
          <label className={ui.field}>
            <span>Nível de auditoria</span>
            <select
              className={ui.input}
              {...register("inputData.auditLevel")}
            >
              {webPlatformAuditLevels.map((value) => (
                <option value={value} key={value}>
                  {platformOptionLabel(value)}
                </option>
              ))}
            </select>
            <FieldError message={errors.inputData?.auditLevel?.message} />
          </label>
        </div>
      </div>
    </section>
  );
}
