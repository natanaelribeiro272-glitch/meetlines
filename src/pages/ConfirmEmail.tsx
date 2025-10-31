import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!tokenHash || type !== "email") {
        setStatus("error");
        setMessage("Link de confirmação inválido");
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email"
        });

        if (error) {
          console.error("Erro ao confirmar email:", error);
          setStatus("error");
          setMessage(error.message || "Erro ao confirmar email");
          return;
        }

        if (data.user) {
          await supabase
            .from("profiles")
            .update({ email_confirmed: true })
            .eq("user_id", data.user.id);

          const { data: profileData } = await supabase
            .from("profiles")
            .select("role, onboarding_completed")
            .eq("user_id", data.user.id)
            .single();

          setStatus("success");
          setMessage("Email confirmado com sucesso!");

          setTimeout(() => {
            if (profileData?.onboarding_completed) {
              navigate("/");
            } else if (profileData?.role === "organizer") {
              navigate("/organizer-onboarding");
            } else {
              navigate("/user-onboarding");
            }
          }, 2000);
        }
      } catch (err: any) {
        console.error("Erro inesperado:", err);
        setStatus("error");
        setMessage("Erro ao confirmar email. Tente novamente.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          {status === "loading" && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          {status === "success" && (
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          )}
          {status === "error" && (
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {status === "loading" && "Confirmando seu email..."}
            {status === "success" && "Email confirmado!"}
            {status === "error" && "Erro na confirmação"}
          </h1>
          <p className="text-muted-foreground">{message}</p>
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para completar seu cadastro...
            </p>
          )}
        </div>

        {status === "error" && (
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Voltar para login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
