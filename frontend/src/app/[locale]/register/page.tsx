"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRegisterSchema, type RegisterInput } from "@/validation";
import { useAuth } from "@/lib/auth-context";
import { ApiRequestError } from "@/lib/api";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const registerSchema = useMemo(() => createRegisterSchema(tValidation), [tValidation]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      await registerUser({ ...values, phone: values.phone || undefined });
      router.push("/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : t("genericError"));
    }
  }

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("alreadyRegistered")}{" "}
          <Link href="/login" className="font-medium text-teal hover:underline">
            {t("logIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name" required>{t("fullName")}</Label>
          <Input id="name" autoComplete="name" error={errors.name?.message} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email" required>{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">{t("phoneOptional")}</Label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="+241 XX XX XX XX" error={errors.phone?.message} {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="password" required>{t("password")}</Label>
          <PasswordInput id="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          {t("createAccount")}
        </Button>
      </form>
    </AuthShell>
  );
}
