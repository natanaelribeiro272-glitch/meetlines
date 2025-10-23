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
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (isMobile && !isNativeApp) {
                window.close();
              } else {
                navigate(-1);
              }
            }}
            className="mb-4 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Gestão Financeira</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie seus dados bancários e acompanhe suas vendas
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:gap-10">
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card rounded-xl border p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-1">Dados Financeiros</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Configure suas informações bancárias e fiscais
                </p>
              </div>
              <OrganizerFinancial organizerId={organizerData.id} />
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="bg-card rounded-xl border p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-1">Vendas de Ingressos</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Acompanhe suas vendas e repasses
                </p>
              </div>
              <TicketSalesOverview organizerId={organizerData.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
