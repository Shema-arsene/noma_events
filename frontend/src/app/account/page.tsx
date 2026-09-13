"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiPatch, ApiRequestError } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function AccountForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await apiPatch("/me", { name, phone });
      await refresh();
      setMessage("Profil mis à jour.");
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Mon profil</h1>

      <div className="mt-6 flex gap-3 text-sm">
        <Link href="/account/tickets" className="focus-ring rounded-full border border-ink/15 px-4 py-2 hover:bg-white">
          Mes billets
        </Link>
        <Link href="/account/orders" className="focus-ring rounded-full border border-ink/15 px-4 py-2 hover:bg-white">
          Mes commandes
        </Link>
      </div>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Adresse e-mail</Label>
            <Input value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {message && <p className="text-sm text-teal">{message}</p>}
          <Button loading={saving} onClick={handleSave}>
            Enregistrer
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountForm />
    </RequireAuth>
  );
}
