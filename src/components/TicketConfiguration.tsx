import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Info, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
  minQuantity: number;
  maxQuantity: number;
}

export interface TicketSettings {
  feePayer: "buyer" | "organizer";
  platformFeePercentage: number;
  paymentProcessingFeePercentage: number;
  paymentProcessingFeeFixed: number;
  cancellationPolicy: string;
  acceptsPix: boolean;
  acceptsCreditCard: boolean;
  acceptsDebitCard: boolean;
  maxInstallments: number;
}

interface TicketConfigurationProps {
  ticketTypes: TicketType[];
  ticketSettings: TicketSettings;
  onTicketTypesChange: (types: TicketType[]) => void;
  onTicketSettingsChange: (settings: TicketSettings) => void;
  onTermsAccepted: (accepted: boolean) => void;
  termsAccepted: boolean;
  organizerId: string;
}

export default function TicketConfiguration({
  ticketTypes,
  ticketSettings,
  onTicketTypesChange,
  onTicketSettingsChange,
  termsAccepted,
  onTermsAccepted,
  organizerId
}: TicketConfigurationProps) {
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasFinancialData, setHasFinancialData] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkFinancialData();
  }, [organizerId]);

  const checkFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizer_financial_data')
        .select('id, is_verified')
        .eq('organizer_id', organizerId)
        .maybeSingle();

      if (error) throw error;
      setHasFinancialData(!!data);
    } catch (error) {
      console.error('Error checking financial data:', error);
      setHasFinancialData(false);
    }
  };

  const handleAddTicket = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: "",
      description: "",
      price: 0,
      quantity: 100,
      minQuantity: 1,
      maxQuantity: 10
    };
    setEditingTicket(newTicket);
    setIsDialogOpen(true);
  };

  const handleEditTicket = (ticket: TicketType) => {
    setEditingTicket({ ...ticket });
    setIsDialogOpen(true);
  };

  const handleSaveTicket = () => {
    if (!editingTicket) return;

    const existingIndex = ticketTypes.findIndex(t => t.id === editingTicket.id);
    if (existingIndex >= 0) {
      const updated = [...ticketTypes];
      updated[existingIndex] = editingTicket;
      onTicketTypesChange(updated);
    } else {
      onTicketTypesChange([...ticketTypes, editingTicket]);
    }
    setIsDialogOpen(false);
    setEditingTicket(null);
  };

  const handleDeleteTicket = (id: string) => {
    onTicketTypesChange(ticketTypes.filter(t => t.id !== id));
  };

  const calculateFees = (price: number) => {
    const platformFee = (price * ticketSettings.platformFeePercentage) / 100;
    const processingFee = (price * ticketSettings.paymentProcessingFeePercentage) / 100 + 
                         ticketSettings.paymentProcessingFeeFixed;
    const totalFees = platformFee + processingFee;
    
    if (ticketSettings.feePayer === "buyer") {
      return {
        subtotal: price,
        fees: totalFees,
        total: price + totalFees,
        organizerReceives: price
      };
    } else {
      return {
        subtotal: price,
        fees: totalFees,
        total: price,
        organizerReceives: price - totalFees
      };
    }
  };

  return (
    <div className="space-y-6">
      {hasFinancialData === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Você precisa cadastrar seus dados financeiros antes de vender ingressos.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organizer-profile')}
              className="ml-4"
            >
              Cadastrar Agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Configurações de Taxa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configurações de Taxas</CardTitle>
          <CardDescription>
            Defina quem paga as taxas da plataforma e processamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Quem paga as taxas?</Label>
            <RadioGroup
              value={ticketSettings.feePayer}
              onValueChange={(value: "buyer" | "organizer") =>
                onTicketSettingsChange({ ...ticketSettings, feePayer: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buyer" id="buyer" />
                <Label htmlFor="buyer" className="cursor-pointer font-normal">
                  Comprador (taxa adicionada ao valor do ingresso)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="organizer" id="organizer" />
                <Label htmlFor="organizer" className="cursor-pointer font-normal">
                  Organizador (taxa descontada do valor recebido)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="space-y-1">
                <p><strong>Taxa da Plataforma:</strong> {ticketSettings.platformFeePercentage}% por ingresso</p>
                <p><strong>Taxa de Processamento:</strong> {ticketSettings.paymentProcessingFeePercentage}% + R$ {ticketSettings.paymentProcessingFeeFixed.toFixed(2)}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Exemplo de cálculo */}
          {ticketTypes.length > 0 && (
            <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold mb-2">Exemplo com ingresso de R$ {ticketTypes[0].price.toFixed(2)}:</p>
              {(() => {
                const calc = calculateFees(ticketTypes[0].price);
                return (
                  <>
                    <p>Valor do ingresso: R$ {calc.subtotal.toFixed(2)}</p>
                    <p>Taxas totais: R$ {calc.fees.toFixed(2)}</p>
                    <p className="font-semibold text-primary">
                      {ticketSettings.feePayer === "buyer" 
                        ? `Comprador paga: R$ ${calc.total.toFixed(2)}`
                        : `Organizador recebe: R$ ${calc.organizerReceives.toFixed(2)}`
                      }
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pix">PIX</Label>
            <Switch
              id="pix"
              checked={ticketSettings.acceptsPix}
              onCheckedChange={(checked) =>
                onTicketSettingsChange({ ...ticketSettings, acceptsPix: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="credit">Cartão de Crédito</Label>
            <Switch
              id="credit"
              checked={ticketSettings.acceptsCreditCard}
              onCheckedChange={(checked) =>
                onTicketSettingsChange({ ...ticketSettings, acceptsCreditCard: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="debit">Cartão de Débito</Label>
            <Switch
              id="debit"
              checked={ticketSettings.acceptsDebitCard}
              onCheckedChange={(checked) =>
                onTicketSettingsChange({ ...ticketSettings, acceptsDebitCard: checked })
              }
            />
          </div>

          {ticketSettings.acceptsCreditCard && (
            <div>
              <Label htmlFor="installments">Máximo de Parcelas</Label>
              <Select
                value={ticketSettings.maxInstallments.toString()}
                onValueChange={(value) =>
                  onTicketSettingsChange({ ...ticketSettings, maxInstallments: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Política de Cancelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Política de Cancelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Exemplo: Cancelamento com reembolso total até 7 dias antes do evento. Após esse período, não haverá reembolso."
            value={ticketSettings.cancellationPolicy}
            onChange={(e) =>
              onTicketSettingsChange({ ...ticketSettings, cancellationPolicy: e.target.value })
            }
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Tipos de Ingressos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Tipos de Ingressos / Lotes</CardTitle>
              <CardDescription>
                Configure os diferentes tipos e lotes de ingressos
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddTicket}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ticketTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Nenhum tipo de ingresso configurado</p>
              <Button variant="outline" size="sm" onClick={handleAddTicket}>
                Criar Primeiro Lote
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ticketTypes.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{ticket.name}</h4>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-primary font-semibold">
                            R$ {ticket.price.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            {ticket.quantity} ingressos
                          </span>
                          <span className="text-muted-foreground">
                            Min: {ticket.minQuantity} / Máx: {ticket.maxQuantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTicket(ticket)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Termos e Condições */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Switch
              id="terms"
              checked={termsAccepted}
              onCheckedChange={onTermsAccepted}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="cursor-pointer">
                Aceito os{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-primary underline"
                >
                  termos e condições
                </button>{" "}
                para venda de ingressos na plataforma
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Ao aceitar, você concorda com as taxas de serviço e políticas da plataforma
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar tipo de ingresso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTicket && ticketTypes.find(t => t.id === editingTicket.id)
                ? "Editar Ingresso"
                : "Novo Ingresso"}
            </DialogTitle>
            <DialogDescription>
              Configure as informações do tipo de ingresso ou lote
            </DialogDescription>
          </DialogHeader>

          {editingTicket && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ticket-name">Nome do Lote *</Label>
                <Input
                  id="ticket-name"
                  placeholder="Ex: 1º Lote, VIP, Pista..."
                  value={editingTicket.name}
                  onChange={(e) =>
                    setEditingTicket({ ...editingTicket, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="ticket-description">Descrição</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Descreva o que inclui neste ingresso..."
                  value={editingTicket.description}
                  onChange={(e) =>
                    setEditingTicket({ ...editingTicket, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ticket-price">Preço (R$) *</Label>
                  <Input
                    id="ticket-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingTicket.price}
                    onChange={(e) =>
                      setEditingTicket({ ...editingTicket, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="ticket-quantity">Quantidade *</Label>
                  <Input
                    id="ticket-quantity"
                    type="number"
                    min="1"
                    value={editingTicket.quantity}
                    onChange={(e) =>
                      setEditingTicket({ ...editingTicket, quantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">Período de Vendas (Opcional)</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sales-start" className="text-xs text-muted-foreground">
                      Início das Vendas
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="sales-start"
                        type="date"
                        value={editingTicket.salesStartDate || ""}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, salesStartDate: e.target.value })
                        }
                      />
                      <Input
                        type="time"
                        value={editingTicket.salesStartTime || ""}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, salesStartTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sales-end" className="text-xs text-muted-foreground">
                      Fim das Vendas
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="sales-end"
                        type="date"
                        value={editingTicket.salesEndDate || ""}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, salesEndDate: e.target.value })
                        }
                      />
                      <Input
                        type="time"
                        value={editingTicket.salesEndTime || ""}
                        onChange={(e) =>
                          setEditingTicket({ ...editingTicket, salesEndTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="min-qty">Mín. por Compra</Label>
                  <Input
                    id="min-qty"
                    type="number"
                    min="1"
                    value={editingTicket.minQuantity}
                    onChange={(e) =>
                      setEditingTicket({ ...editingTicket, minQuantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max-qty">Máx. por Compra</Label>
                  <Input
                    id="max-qty"
                    type="number"
                    min="1"
                    value={editingTicket.maxQuantity}
                    onChange={(e) =>
                      setEditingTicket({ ...editingTicket, maxQuantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSaveTicket}
                  disabled={!editingTicket.name || editingTicket.price <= 0}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Termos */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termos e Condições - Venda de Ingressos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Taxas e Repasses</h3>
              <p className="text-muted-foreground">
                A plataforma cobra uma taxa de serviço de {ticketSettings.platformFeePercentage}% sobre cada ingresso vendido, 
                além da taxa de processamento de pagamento de {ticketSettings.paymentProcessingFeePercentage}% + 
                R$ {ticketSettings.paymentProcessingFeeFixed.toFixed(2)} por transação.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Repasse de Valores</h3>
              <p className="text-muted-foreground">
                Os valores das vendas serão repassados ao organizador em até 30 dias após a realização do evento, 
                descontadas as taxas aplicáveis (se o organizador for o pagador das taxas).
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Responsabilidades do Organizador</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Garantir a realização do evento conforme anunciado</li>
                <li>Respeitar a política de cancelamento estabelecida</li>
                <li>Fornecer suporte aos participantes</li>
                <li>Manter dados fiscais atualizados para emissão de notas fiscais</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Cancelamentos e Reembolsos</h3>
              <p className="text-muted-foreground">
                Em caso de cancelamento do evento, o organizador deve solicitar o cancelamento na plataforma 
                e os valores serão reembolsados aos participantes de acordo com a política estabelecida. 
                As taxas da plataforma não são reembolsáveis.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Integração com Stripe</h3>
              <p className="text-muted-foreground">
                Os pagamentos são processados através do Stripe. Ao aceitar estes termos, você também 
                concorda com os{" "}
                <a 
                  href="https://stripe.com/br/legal/connect-account" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Termos de Serviço do Stripe Connect
                </a>.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Compliance e Documentação</h3>
              <p className="text-muted-foreground">
                O organizador é responsável por fornecer todos os documentos necessários para 
                validação da conta, incluindo CPF/CNPJ, dados bancários e comprovante de endereço.
              </p>
            </section>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}