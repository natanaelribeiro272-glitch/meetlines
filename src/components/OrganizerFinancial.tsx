import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, MapPin, Phone, Mail, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinancialData {
  id?: string;
  document_type: 'cpf' | 'cnpj';
  document_number: string;
  legal_name: string;
  trading_name: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  bank_code: string;
  bank_name: string;
  account_type: 'corrente' | 'poupanca';
  agency: string;
  agency_digit: string;
  account_number: string;
  account_digit: string;
  phone: string;
  email: string;
  auto_transfer: boolean;
  transfer_day: number;
  is_verified: boolean;
}

interface OrganizerFinancialProps {
  organizerId: string;
}

const BRAZILIAN_BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "077", name: "Banco Inter" },
  { code: "260", name: "Nu Pagamentos (Nubank)" },
  { code: "290", name: "PagSeguro" },
  { code: "323", name: "Mercado Pago" },
  { code: "212", name: "Banco Original" },
  { code: "756", name: "Bancoob (Sicoob)" },
  { code: "748", name: "Sicredi" },
  { code: "422", name: "Banco Safra" },
];

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function OrganizerFinancial({ organizerId }: OrganizerFinancialProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(false);

  const [formData, setFormData] = useState<FinancialData>({
    document_type: 'cpf',
    document_number: '',
    legal_name: '',
    trading_name: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    bank_code: '',
    bank_name: '',
    account_type: 'corrente',
    agency: '',
    agency_digit: '',
    account_number: '',
    account_digit: '',
    phone: '',
    email: '',
    auto_transfer: false,
    transfer_day: 5,
    is_verified: false,
  });

  useEffect(() => {
    loadFinancialData();
  }, [organizerId]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizer_financial_data')
        .select('*')
        .eq('organizer_id', organizerId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(data);
        setHasData(true);
      }
    } catch (error: any) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (bankCode: string) => {
    const bank = BRAZILIAN_BANKS.find(b => b.code === bankCode);
    setFormData({
      ...formData,
      bank_code: bankCode,
      bank_name: bank?.name || '',
    });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleDocumentChange = (value: string) => {
    let formatted = value;
    if (formData.document_type === 'cpf') {
      formatted = formatCPF(value);
    } else {
      formatted = formatCNPJ(value);
    }
    setFormData({ ...formData, document_number: formatted });
  };

  const searchZipCode = async () => {
    const zipCode = formData.zip_code.replace(/\D/g, '');
    if (zipCode.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData({
          ...formData,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        });
      }
    } catch (error) {
      console.error('Error fetching zip code:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        organizer_id: organizerId,
        ...formData,
      };

      if (hasData) {
        const { error } = await supabase
          .from('organizer_financial_data')
          .update(dataToSave)
          .eq('organizer_id', organizerId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organizer_financial_data')
          .insert([dataToSave]);

        if (error) throw error;
        setHasData(true);
      }

      toast({
        title: "Dados salvos com sucesso!",
        description: "Suas informações financeiras foram atualizadas.",
      });
    } catch (error: any) {
      console.error('Error saving financial data:', error);
      toast({
        title: "Erro ao salvar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados Fiscais
              </CardTitle>
              <CardDescription>
                Informações do responsável legal pela conta
              </CardDescription>
            </div>
            {formData.is_verified && (
              <Badge variant="default" className="gap-1">
                <Shield className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!formData.is_verified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seus dados serão verificados pela equipe antes de liberar os repasses
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: 'cpf' | 'cnpj') =>
                  setFormData({ ...formData, document_type: value, document_number: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF - Pessoa Física</SelectItem>
                  <SelectItem value="cnpj">CNPJ - Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{formData.document_type === 'cpf' ? 'CPF' : 'CNPJ'}</Label>
              <Input
                value={formData.document_number}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Razão Social / Nome Completo</Label>
              <Input
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Nome legal conforme documento"
                required
              />
            </div>

            {formData.document_type === 'cnpj' && (
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.trading_name}
                  onChange={(e) => setFormData({ ...formData, trading_name: e.target.value })}
                  placeholder="Nome fantasia da empresa"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço Fiscal
          </CardTitle>
          <CardDescription>
            Endereço conforme documento fiscal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: formatZipCode(e.target.value) })}
                onBlur={searchZipCode}
                placeholder="00000-000"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro</Label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Rua, Avenida, etc"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="123"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Complemento</Label>
              <Input
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                placeholder="Apartamento, sala, etc"
              />
            </div>

            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Bairro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dados Bancários
          </CardTitle>
          <CardDescription>
            Conta para recebimento dos repasses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Banco</Label>
              <Select
                value={formData.bank_code}
                onValueChange={handleBankChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: 'corrente' | 'poupanca') =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agência</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value.replace(/\D/g, '') })}
                  placeholder="0000"
                  className="flex-1"
                  required
                />
                <Input
                  value={formData.agency_digit}
                  onChange={(e) => setFormData({ ...formData, agency_digit: e.target.value })}
                  placeholder="X"
                  className="w-16"
                  maxLength={1}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Número da Conta</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="00000000"
                  className="flex-1"
                  required
                />
                <Input
                  value={formData.account_digit}
                  onChange={(e) => setFormData({ ...formData, account_digit: e.target.value })}
                  placeholder="X"
                  className="w-16"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Dados de Contato
          </CardTitle>
          <CardDescription>
            Informações para comunicação sobre repasses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Repasse Automático</Label>
                <div className="text-sm text-muted-foreground">
                  Receba automaticamente sem precisar solicitar
                </div>
              </div>
              <Switch
                checked={formData.auto_transfer}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_transfer: checked })}
              />
            </div>

            {formData.auto_transfer && (
              <div className="space-y-2">
                <Label>Dia do Repasse</Label>
                <Select
                  value={formData.transfer_day.toString()}
                  onValueChange={(value) => setFormData({ ...formData, transfer_day: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day} de cada mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Salvando..." : hasData ? "Atualizar Dados" : "Salvar Dados"}
        </Button>
      </div>
    </form>
  );
}
