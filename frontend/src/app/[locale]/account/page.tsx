"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { apiPatch, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  const t = useTranslations("account");
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
      setMessage(t("profileUpdated"));
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : t("updateError"));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="name">{t("fullName")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t("emailAddress")}</Label>
            <Input value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {message && <p className="text-sm text-teal">{message}</p>}
          <Button loading={saving} onClick={handleSave}>
            {t("save")}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
