"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validation";
import { useAuth } from "@/lib/auth-context";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get("redirect") || "/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="font-display text-2xl font-bold text-ink">Connexion</h1>
          <p className="mt-1 text-sm text-ink/60">Accédez à vos billets et à votre compte.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" required>Adresse e-mail</Label>
              <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password" required>Mot de passe</Label>
              <Input id="password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-teal hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
