"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validation";
import { useAuth } from "@/lib/auth-context";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      setServerError(err instanceof ApiRequestError ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="font-display text-2xl font-bold text-ink">Créer un compte</h1>
          <p className="mt-1 text-sm text-ink/60">Rejoignez Noma Events pour découvrir et réserver.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name" required>Nom complet</Label>
              <Input id="name" autoComplete="name" error={errors.name?.message} {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="email" required>Adresse e-mail</Label>
              <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input id="phone" type="tel" autoComplete="tel" placeholder="+241 XX XX XX XX" error={errors.phone?.message} {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <Label htmlFor="password" required>Mot de passe</Label>
              <Input id="password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-medium text-teal hover:underline">
              Se connecter
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
