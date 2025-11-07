import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  ticketQuantity: number;
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  eventTitle,
  ticketQuantity,
}: PaymentSuccessDialogProps) {
  const navigate = useNavigate();

  const handleGoToTickets = () => {
    onOpenChange(false);
    setTimeout(() => {
      navigate("/user-events");
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 py-8 relative">
          <Badge className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Sucesso
          </Badge>
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Pagamento Confirmado!
            </h2>
            <p className="text-gray-600 max-w-xs mx-auto">
              Seus ingressos foram gerados com sucesso e já estão disponíveis
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Evento:</span>
              <span className="font-semibold text-gray-900">{eventTitle}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Quantidade:</span>
              <span className="font-semibold text-gray-900">
                {ticketQuantity} {ticketQuantity === 1 ? "ingresso" : "ingressos"}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <Button
              onClick={handleGoToTickets}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Ticket className="h-5 w-5 mr-2" />
              Ver Meus Ingressos
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continuar Navegando
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Seus ingressos estão disponíveis na área "Meus Eventos"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
