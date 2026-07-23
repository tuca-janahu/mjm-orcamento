import { zodResolver } from "@hookform/resolvers/zod";
import { applicationTypes, createProjectInputSchema } from "@mjm/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { api } from "../../lib/api";
import { apiErrorMessage } from "../../lib/api-error";
import type { ProjectSummary } from "../../lib/api-types";
import { labelFromEnum } from "../../lib/format";
import type { z } from "zod";
import { ui } from "../../lib/ui";

type ProjectFormValues = z.input<typeof createProjectInputSchema>;

export function ProjectFormPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: { applicationType: "WEBSITE", status: "PROSPECCAO" },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { data } = await api.post<{ project: ProjectSummary }>(
        "/projects",
        values,
      );
      void navigate(`/projects/${data.project.id}`);
    } catch (error) {
      setServerError(
        apiErrorMessage(error, "Não foi possível criar o projeto."),
      );
    }
  });

  return (
    <div className={ui.narrowPage}>
      <header className={ui.pageHeading}>
        <div>
          <Link
            className="mb-6 inline-flex items-center gap-2 text-[0.625rem] font-bold tracking-[0.1em] text-zinc-500 uppercase no-underline transition-colors hover:text-zinc-950"
            to="/projects"
          >
            <span aria-hidden="true">←</span> Voltar
          </Link>
          <p className={ui.eyebrow}>Projetos / Novo</p>
          <h1 className={ui.pageTitle}>Novo projeto</h1>
          <p className={ui.subtitle}>
            Cadastre o contexto comercial antes de criar o orçamento.
          </p>
        </div>
      </header>
      <form className={ui.form} onSubmit={submit} noValidate>
        <section className={ui.formSection}>
          <div className={ui.formSectionHeading}>
            <span className="text-[0.625rem] font-bold text-zinc-400">01</span>
            <div>
              <h2 className="m-0 mb-2 text-sm font-semibold">Identificação</h2>
              <p className="m-0 text-xs leading-relaxed text-zinc-500">
                Informações gerais do projeto e do cliente.
              </p>
            </div>
          </div>
          <div className={ui.formGrid}>
            <label className={ui.fieldWide}>
              <span>Nome do projeto</span>
              <input className={ui.input} {...register("name")} />
              {errors.name && (
                <small className={ui.fieldError}>{errors.name.message}</small>
              )}
            </label>
            <label className={ui.field}>
              <span>Cliente</span>
              <input className={ui.input} {...register("clientName")} />
            </label>
            <label className={ui.field}>
              <span>Tipo de aplicação</span>
              <select className={ui.input} {...register("applicationType")}>
                {applicationTypes.map((type) => (
                  <option value={type} key={type}>
                    {labelFromEnum(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.fieldWide}>
              <span>Descrição</span>
              <textarea
                className={ui.textarea}
                rows={4}
                {...register("description")}
              />
            </label>
            <label className={ui.fieldWide}>
              <span>Observações</span>
              <textarea
                className={ui.textarea}
                rows={3}
                {...register("notes")}
              />
            </label>
          </div>
        </section>
        {serverError && <div className={ui.error}>{serverError}</div>}
        <div className={ui.formActions}>
          <Link className={ui.secondaryAction} to="/projects">
            Cancelar
          </Link>
          <button
            className={`${ui.primaryAction} min-w-48`}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Salvando..." : "Criar projeto"} <span>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
