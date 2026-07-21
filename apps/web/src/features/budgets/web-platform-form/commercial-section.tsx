import {
  complexityAdjustments,
  hostingPlans,
  maintenancePlans,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { WebPlatformBudgetFormValues } from "./config";
import { platformOptionLabel } from "./config";
import { FieldError, SectionHeading } from "./form-ui";

export function CommercialSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WebPlatformBudgetFormValues>();
  const complexityAdjustment = watch("inputData.complexityAdjustment");
  const discountPercentage = watch("inputData.discountPercentage");

  useEffect(() => {
    if (complexityAdjustment === "NONE") {
      setValue("inputData.complexityReason", undefined);
    }
  }, [complexityAdjustment, setValue]);

  useEffect(() => {
    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage <= 0
    ) {
      setValue("inputData.discountReason", undefined);
    }
  }, [discountPercentage, setValue]);

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="05"
        title="Operação e condições comerciais"
        description="Defina a operação recorrente e registre ajustes que alteram o cálculo final."
      />
      <div className={ui.formGrid}>
        <label className={ui.field}>
          <span>Hospedagem</span>
          <select
            className={ui.input}
            {...register("inputData.hostingPlan")}
          >
            {hostingPlans.map((value) => (
              <option value={value} key={value}>
                {platformOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError message={errors.inputData?.hostingPlan?.message} />
        </label>
        <label className={ui.field}>
          <span>Manutenção mensal</span>
          <select
            className={ui.input}
            {...register("inputData.maintenancePlan")}
          >
            {maintenancePlans.map((value) => (
              <option value={value} key={value}>
                {platformOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError message={errors.inputData?.maintenancePlan?.message} />
        </label>
        <label className={ui.field}>
          <span>Ajuste de complexidade</span>
          <select
            className={ui.input}
            {...register("inputData.complexityAdjustment")}
          >
            {complexityAdjustments.map((value) => (
              <option value={value} key={value}>
                {platformOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError
            message={errors.inputData?.complexityAdjustment?.message}
          />
        </label>
        {complexityAdjustment !== "NONE" && (
          <label className={ui.field}>
            <span>Justificativa da complexidade</span>
            <textarea
              className={ui.textarea}
              {...register("inputData.complexityReason", {
                setValueAs: (value: string) =>
                  value.trim() === "" ? undefined : value,
              })}
            />
            <FieldError
              message={errors.inputData?.complexityReason?.message}
            />
          </label>
        )}
        <label className={ui.field}>
          <span>Desconto percentual</span>
          <input
            className={ui.input}
            type="number"
            min="0"
            max="100"
            step="0.01"
            {...register("inputData.discountPercentage", {
              valueAsNumber: true,
            })}
          />
          <FieldError
            message={errors.inputData?.discountPercentage?.message}
          />
        </label>
        {discountPercentage > 0 && (
          <label className={ui.field}>
            <span>Justificativa do desconto</span>
            <textarea
              className={ui.textarea}
              {...register("inputData.discountReason", {
                setValueAs: (value: string) =>
                  value.trim() === "" ? undefined : value,
              })}
            />
            <FieldError message={errors.inputData?.discountReason?.message} />
          </label>
        )}
        <label className={`${ui.field} sm:col-span-2`}>
          <span>Observações gerais</span>
          <textarea
            className={ui.textarea}
            placeholder="Premissas, exclusões ou informações úteis para a proposta"
            {...register("notes", {
              setValueAs: (value: string) => value.trim(),
            })}
          />
          <FieldError message={errors.notes?.message} />
        </label>
      </div>
    </section>
  );
}
