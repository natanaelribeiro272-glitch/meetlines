import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganizer } from "@/hooks/useOrganizer";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import OrganizerFinancial from "@/components/OrganizerFinancial";
import TicketSalesOverview from "@/components/TicketSalesOverview";
import { Separator } from "@/components/ui/separator";

export default function OrganizerFinancialPage() {
  const navigate = useNavigate();
  const { organizerData } = useOrganizer();
  const { isNativeApp } = usePlatformDetection();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (!organizerData?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (isMobile && !isNativeApp) {
                window.close();
              } else {
                navigate(-1);
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus dados bancários e acompanhe suas vendas
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dados Financeiros</h2>
              <p className="text-muted-foreground mb-4">
                Configure suas informações bancárias e fiscais
              </p>
              <OrganizerFinancial organizerId={organizerData.id} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Vendas de Ingressos</h2>
              <p className="text-muted-foreground mb-4">
                Acompanhe suas vendas e repasses
              </p>
              <TicketSalesOverview organizerId={organizerData.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
