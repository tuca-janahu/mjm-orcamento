import {
  complexityAdjustments,
  hostingPlans,
  maintenancePlans,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { InternalSystemBudgetFormValues } from "./config";
import { internalSystemOptionLabel } from "./config";
import { FieldError, SectionHeading } from "./form-ui";

export function CommercialSection() {
  const {
    clearErrors,
    register,
    unregister,
    watch,
    formState: { errors },
  } = useFormContext<InternalSystemBudgetFormValues>();
  const complexityAdjustment = watch("inputData.complexityAdjustment");
  const discountPercentage = watch("inputData.discountPercentage");

  useEffect(() => {
    if (complexityAdjustment !== "NONE") return;

    unregister("inputData.complexityReason");
    clearErrors("inputData.complexityReason");
  }, [clearErrors, complexityAdjustment, unregister]);

  useEffect(() => {
    if (Number.isFinite(discountPercentage) && discountPercentage > 0) return;

    unregister("inputData.discountReason");
    clearErrors("inputData.discountReason");
  }, [clearErrors, discountPercentage, unregister]);

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="04"
        title="Operação e condições comerciais"
        description="Defina hospedagem, manutenção e ajustes excepcionais aplicados ao orçamento."
      />
      <div className={ui.formGrid}>
        <label className={ui.field}>
          <span>Hospedagem</span>
          <select className={ui.input} {...register("inputData.hostingPlan")}>
            {hostingPlans.map((value) => (
              <option value={value} key={value}>
                {internalSystemOptionLabel(value)}
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
                {internalSystemOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError message={errors.inputData?.maintenancePlan?.message} />
        </label>
        <label className={ui.field}>
          <span>Ajuste de complexidade</span>
          <select
            aria-label="Ajuste de complexidade"
            className={ui.input}
            {...register("inputData.complexityAdjustment")}
          >
            {complexityAdjustments.map((value) => (
              <option value={value} key={value}>
                {internalSystemOptionLabel(value)}
              </option>
            ))}
          </select>
          <small className="text-[0.6875rem] leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
            Use o ajuste global apenas para dependências entre módulos, regras
            compartilhadas críticas ou impacto operacional amplo não capturado
            pela complexidade individual dos módulos.
          </small>
          <FieldError
            message={errors.inputData?.complexityAdjustment?.message}
          />
        </label>
        {complexityAdjustment !== "NONE" && (
          <label className={ui.field}>
            <span>Justificativa da complexidade</span>
            <textarea
              aria-label="Justificativa da complexidade"
              className={ui.textarea}
              maxLength={500}
              rows={3}
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
        {Number.isFinite(discountPercentage) && discountPercentage > 0 && (
          <label className={ui.field}>
            <span>Justificativa do desconto</span>
            <textarea
              aria-label="Justificativa do desconto"
              className={ui.textarea}
              maxLength={500}
              rows={3}
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
            maxLength={4_000}
            placeholder="Premissas, exclusões ou informações úteis para a proposta"
            rows={4}
            {...register("notes", {
              setValueAs: (value: string) =>
                value.trim() === "" ? undefined : value,
            })}
          />
          <FieldError message={errors.notes?.message} />
        </label>
      </div>
    </section>
  );
}
