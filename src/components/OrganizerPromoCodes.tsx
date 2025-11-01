import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  min_purchase_amount: number;
  is_active: boolean;
  created_at: string;
}

interface OrganizerPromoCodesProps {
  eventId: string;
}

export function OrganizerPromoCodes({ eventId }: OrganizerPromoCodesProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
    min_purchase_amount: "0",
    is_active: true,
  });

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error loading promo codes:", error);
      toast.error("Erro ao carregar códigos promocionais");
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadPromoCodes();
  });

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("promo_codes").insert({
        event_id: eventId,
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success("Código promocional criado com sucesso!");
      setDialogOpen(false);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        max_uses: "",
        valid_from: "",
        valid_until: "",
        min_purchase_amount: "0",
        is_active: true,
      });
      loadPromoCodes();
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Este código já existe para este evento");
      } else {
        toast.error("Erro ao criar código promocional");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este código promocional?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Código promocional excluído");
      loadPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Erro ao excluir código promocional");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Código ${!currentState ? "ativado" : "desativado"}`);
      loadPromoCodes();
    } catch (error) {
      console.error("Error toggling promo code:", error);
      toast.error("Erro ao atualizar código");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `R$ ${value.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Códigos Promocionais</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Código
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Código Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: DESCONTO10"
                  maxLength={20}
                />
              </div>

              <div>
                <Label htmlFor="discount_type">Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount_value">
                  Valor do Desconto * {formData.discount_type === "percentage" ? "(%)" : "(R$)"}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === "percentage" ? "10" : "10.00"}
                />
              </div>

              <div>
                <Label htmlFor="max_uses">Máximo de Usos (deixe vazio para ilimitado)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>

              <div>
                <Label htmlFor="min_purchase_amount">Valor Mínimo de Compra (R$)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  step="0.01"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="valid_from">Válido De</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="valid_until">Válido Até</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Código ativo</Label>
              </div>

              <Button onClick={handleCreate} disabled={loading} className="w-full">
                Criar Código
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {promoCodes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum código promocional criado ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold">{promo.code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(promo.code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatDiscount(promo.discount_type, promo.discount_value)}</TableCell>
                    <TableCell>
                      {promo.current_uses} / {promo.max_uses || "∞"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {promo.valid_until
                        ? format(new Date(promo.valid_until), "dd/MM/yyyy")
                        : "Sem limite"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => handleToggleActive(promo.id, promo.is_active)}
                          disabled={loading}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
