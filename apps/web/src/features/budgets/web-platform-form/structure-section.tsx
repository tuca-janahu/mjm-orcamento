import {
  webPlatformAccountStructures,
  webPlatformCategories,
} from "@mjm/shared";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ui } from "../../../lib/ui";
import type { WebPlatformBudgetFormValues } from "./config";
import { platformOptionLabel } from "./config";
import { FieldError, SectionHeading } from "./form-ui";

export function StructureSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WebPlatformBudgetFormValues>();
  const platformCategory = watch("inputData.platformCategory");
  const minimumTargetLaunchDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (platformCategory !== "CUSTOM") {
      setValue("inputData.customCategoryDescription", undefined);
    }
  }, [platformCategory, setValue]);

  return (
    <section className={ui.formSection}>
      <SectionHeading
        number="01"
        title="Contexto e estrutura"
        description="Defina o modelo da plataforma, o tamanho da interface e a estrutura de contas."
      />
      <div className={ui.formGridThree}>
        <label className={ui.field}>
          <span>Categoria da plataforma</span>
          <select
            className={ui.input}
            {...register("inputData.platformCategory")}
          >
            {webPlatformCategories.map((value) => (
              <option value={value} key={value}>
                {value === "CUSTOM"
                  ? "Categoria personalizada"
                  : platformOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError
            message={errors.inputData?.platformCategory?.message}
          />
        </label>
        {platformCategory === "CUSTOM" && (
          <label className={`${ui.field} sm:col-span-2`}>
            <span>Descrição da categoria</span>
            <input
              className={ui.input}
              placeholder="Descreva resumidamente o modelo de negócio"
              {...register("inputData.customCategoryDescription", {
                setValueAs: (value: string) =>
                  value.trim() === "" ? undefined : value,
              })}
            />
            <FieldError
              message={errors.inputData?.customCategoryDescription?.message}
            />
          </label>
        )}
        <label className={ui.field}>
          <span>Estrutura de contas</span>
          <select
            className={ui.input}
            {...register("inputData.accountStructure")}
          >
            {webPlatformAccountStructures.map((value) => (
              <option value={value} key={value}>
                {platformOptionLabel(value)}
              </option>
            ))}
          </select>
          <FieldError
            message={errors.inputData?.accountStructure?.message}
          />
        </label>
        <label className={ui.field}>
          <span>Telas estimadas</span>
          <input
            className={ui.input}
            type="number"
            min="1"
            max="200"
            {...register("inputData.screenCount", { valueAsNumber: true })}
          />
          <FieldError message={errors.inputData?.screenCount?.message} />
        </label>
        <label className={ui.field}>
          <span>Perfis de acesso</span>
          <input
            className={ui.input}
            type="number"
            min="1"
            max="20"
            {...register("inputData.userRoleCount", { valueAsNumber: true })}
          />
          <FieldError message={errors.inputData?.userRoleCount?.message} />
        </label>
        <label className={ui.field}>
          <span>Idiomas</span>
          <input
            className={ui.input}
            type="number"
            min="1"
            max="10"
            {...register("inputData.languageCount", { valueAsNumber: true })}
          />
          <FieldError message={errors.inputData?.languageCount?.message} />
        </label>
        <label className={ui.field}>
          <span>Data desejada de lançamento</span>
          <input
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
    </section>
  );
}
