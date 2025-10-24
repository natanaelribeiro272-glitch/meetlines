import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationSettings() {
  const { isSupported, permissionStatus, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações em tempo real no seu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionStatus === 'granted' ? (
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Notificações ativadas</span>
            </div>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <BellOff className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-red-500">Notificações desativadas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ative nas configurações do dispositivo
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ative as notificações para receber:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Curtidas no seu perfil
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Solicitações de amizade
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Novas mensagens
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Novos eventos dos organizadores que você segue
              </li>
            </ul>
            <Button onClick={requestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
