import { useEffect, useState } from "react";
import { ArrowLeft, Mail, MapPin, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser, getFriendlyErrorMessage, updateCurrentUser } from "@/lib/cargoo-store";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCurrentUser();
        setForm({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        });
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await updateCurrentUser(form);
      toast.success("Perfil actualizado.");
      navigate("/dashboard/profile");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <h1 className="mb-6 text-2xl font-display font-bold">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" value={form.name} onChange={(event) => update("name", event.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" className="pl-10" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Telefono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="tel" className="pl-10" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ubicacion</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" value={form.location} onChange={(event) => update("location", event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            rows={3}
            value={form.bio}
            onChange={(event) => update("bio", event.target.value)}
            placeholder="Cuentanos un poco sobre ti y tu forma de viajar"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
};

export default EditProfilePage;
