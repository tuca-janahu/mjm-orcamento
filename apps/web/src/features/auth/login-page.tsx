import { zodResolver } from "@hookform/resolvers/zod";
import { loginInputSchema, type LoginInput } from "@mjm/shared";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { BrandMark } from "../../components/brand-mark";
import { api } from "../../lib/api";

interface ApiErrorBody {
  error?: { message?: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema) });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await api.post("/auth/login", values);
      void navigate("/");
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        setServerError(
          error.response?.data?.error?.message ?? "Nao foi possivel entrar",
        );
      } else {
        setServerError("Nao foi possivel entrar");
      }
    }
  });

  return (
    <main className="grid min-h-screen grid-cols-1 bg-zinc-50 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className="flex min-h-auto items-center justify-between bg-zinc-950 px-6 py-5 text-white sm:min-h-screen sm:flex-col sm:items-stretch sm:px-6 sm:py-9 lg:px-8"
        aria-label="MJM Orçamentos"
      >
        <BrandMark />

        <div className="hidden gap-2 border-b border-white/15 pb-6 sm:grid">
          <span className="text-[0.625rem] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
            Portal interno
          </span>
          <strong className="text-lg font-semibold">
            Gestão de orçamentos
          </strong>
        </div>

        <span className="hidden text-[0.625rem] font-semibold tracking-[0.18em] text-zinc-400 uppercase sm:block">
          Acesso restrito
        </span>
      </aside>

      <section className="grid min-h-[calc(100vh-65px)] place-items-start p-6 pt-10 sm:min-h-screen sm:place-items-center sm:p-12">
        <form
          className="grid w-full max-w-[400px] gap-7"
          onSubmit={submit}
          noValidate
        >
          <header className="grid gap-2.5">
            <p className="m-0 text-[0.625rem] font-bold tracking-[0.2em] text-zinc-500 uppercase">
              Autenticação
            </p>
            <h1 className="mt-3 mb-0.5 text-3xl leading-tight font-bold tracking-[-0.04em]">
              Entrar
            </h1>
            <p className="m-0 text-sm leading-relaxed text-zinc-500">
              Informe suas credenciais para acessar a plataforma.
            </p>
          </header>

          <div className="grid gap-5">
            <label className="grid gap-2 text-[0.6875rem] font-bold tracking-[0.12em] text-zinc-600 uppercase">
              <span>E-mail</span>
              <input
                className="w-full p-2 border-0 border-b border-zinc-300 bg-transparent py-3 text-[0.9375rem] font-normal tracking-normal text-zinc-950 normal-case outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-[0.6875rem] font-medium tracking-normal text-red-600 normal-case">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="grid gap-2 text-[0.6875rem] font-bold tracking-[0.12em] text-zinc-600 uppercase">
              <span>Senha</span>
              <input
                className="w-full p-2 border-0 border-b border-zinc-300 bg-transparent py-3 text-[0.9375rem] font-normal tracking-normal text-zinc-950 normal-case outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                {...register("password")}
              />
              {errors.password && (
                <span className="text-[0.6875rem] font-medium tracking-normal text-red-600 normal-case">
                  {errors.password.message}
                </span>
              )}
            </label>
          </div>

          {serverError && (
            <div
              className="border-l-[3px] border-red-600 bg-red-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-red-800"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <button
            className="flex w-full cursor-pointer items-center justify-between border border-zinc-950 bg-zinc-950 px-4 py-3.5 text-[0.6875rem] font-bold tracking-[0.12em] text-white uppercase transition-colors hover:bg-transparent hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Entrando..." : "Entrar na plataforma"}</span>
            <span aria-hidden="true">↗</span>
          </button>

          <p className="-mt-3.5 text-center text-[0.5625rem] tracking-[0.1em] text-zinc-400 uppercase">
            Ambiente interno · Cookie seguro
          </p>
        </form>
      </section>
    </main>
  );
}
