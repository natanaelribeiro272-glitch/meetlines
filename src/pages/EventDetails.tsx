import {
  ArrowLeft,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Edit,
  StopCircle,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/AuthModal";
import { TicketPurchaseDialog } from "@/components/TicketPurchaseDialog";
import { useEventDetails } from "@/hooks/useEventDetails";
import { useAuth } from "@/hooks/useAuth";
import { useEventPixels } from "@/hooks/useEventPixels";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { getPublicBaseUrl } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
interface EventDetailsProps {
  onBack: () => void;
  eventId: string | null;
  onRegister?: () => void;
  onFindFriends?: () => void;
  onEdit?: (eventId: string) => void;
  onManageRegistrations?: () => void;
  onViewAttendances?: () => void;
}

export default function EventDetails({
  onBack,
  eventId,
  onRegister,
  onFindFriends,
  onEdit,
  onManageRegistrations,
  onViewAttendances,
}: EventDetailsProps) {
  const { event, loading, comments, toggleLike, addComment } = useEventDetails(eventId);
  const { user, userRole } = useAuth();
  const { trackEvent } = useEventPixels(eventId);
  const navigate = useNavigate();
  const location = useLocation();
  const [newComment, setNewComment] = useState("");
  const [hasConfirmedAttendance, setHasConfirmedAttendance] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalAction, setAuthModalAction] = useState("");
  const [isOrganizerUser, setIsOrganizerUser] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [requestingClaim, setRequestingClaim] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketSettings, setTicketSettings] = useState<any>(null);

  const isOrganizer = user && event?.organizer?.user_id === user.id;

  // Detectar se é um evento online baseado no link
  const isOnlineEvent =
    event?.location_link &&
    (event.location_link.includes("meet.google") ||
      event.location_link.includes("zoom.us") ||
      event.location_link.includes("youtube.com") ||
      event.location_link.includes("twitch.tv") ||
      event.location_link.includes("teams.microsoft") ||
      event.location_link.includes("streamyard") ||
      event.location_link.includes("jitsi"));

  // Verificar se o usuário é organizador
  useEffect(() => {
    const checkIfOrganizer = async () => {
      if (!user) {
        setIsOrganizerUser(false);
        return;
      }

      try {
        const { data, error } = await supabase.from("organizers").select("id").eq("user_id", user.id).maybeSingle();

        if (!error && data) {
          setIsOrganizerUser(true);
          setOrganizerId(data.id);
        }
      } catch (error) {
        console.error("Error checking organizer:", error);
      }
    };

    checkIfOrganizer();
  }, [user]);

  // Check if user has already confirmed attendance
  useEffect(() => {
    const checkAttendance = async () => {
      if (!user || !eventId) {
        setCheckingAttendance(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("event_registrations")
          .select("attendance_confirmed")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setHasConfirmedAttendance(data.attendance_confirmed || false);
        }
      } catch (error) {
        console.error("Error checking attendance:", error);
      } finally {
        setCheckingAttendance(false);
      }
    };

    checkAttendance();
  }, [user, eventId]);

  // Load ticket settings if event has platform tickets
  useEffect(() => {
    const loadTicketSettings = async () => {
      if (!event?.has_platform_tickets || !eventId) return;

      try {
        const { data, error } = await supabase
          .from("event_ticket_settings")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle();

        if (!error && data) {
          setTicketSettings(data);
        }
      } catch (error) {
        console.error("Error loading ticket settings:", error);
      }
    };

    loadTicketSettings();
  }, [event?.has_platform_tickets, eventId]);

  const requireAuth = (action: () => void, actionName: string) => {
    if (!user) {
      setAuthModalAction(`para ${actionName}`);
      setAuthModalOpen(true);
      return;
    }
    action();
  };

  // Função auxiliar para formatizar data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayName = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${dayName}, ${hours}:${minutes}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "agora";
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    requireAuth(async () => {
      await addComment(newComment);
      setNewComment("");
    }, "comentar");
  };

  const handleLike = () => {
    requireAuth(() => {
      toggleLike();
    }, "curtir este evento");
  };

  const handleConfirmPresence = async () => {
    requireAuth(async () => {
      if (!user || !eventId) return;

      setConfirmingAttendance(true);

      try {
        // Check if user has registration
        const { data: existingReg, error: checkError } = await supabase
          .from("event_registrations")
          .select("id, attendance_confirmed")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking registration:", checkError);
          toast.error("Erro ao verificar registro");
          return;
        }

        if (existingReg) {
          // Update existing registration
          const { error: updateError } = await supabase
            .from("event_registrations")
            .update({
              attendance_confirmed: true,
              attendance_confirmed_at: new Date().toISOString(),
            })
            .eq("id", existingReg.id);

          if (updateError) {
            console.error("Error updating attendance:", updateError);
            toast.error("Erro ao confirmar presença");
            return;
          }
        } else {
          // Create new registration with confirmed attendance
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .single();

          const { error: insertError } = await supabase.from("event_registrations").insert({
            event_id: eventId,
            user_id: user.id,
            user_name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
            user_email: user.email || "",
            attendance_confirmed: true,
            attendance_confirmed_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error creating registration:", insertError);
            toast.error("Erro ao confirmar presença");
            return;
          }
        }

        setHasConfirmedAttendance(true);
        toast.success("Presença confirmada com sucesso!");

        trackEvent("CompleteRegistration", {
          event_name: event?.title,
          event_id: eventId,
          value: 0,
          currency: "BRL"
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao confirmar presença");
      } finally {
        setConfirmingAttendance(false);
      }
    }, "confirmar presença");
  };

  const handleCancelAttendance = async () => {
    requireAuth(async () => {
      if (!user || !eventId) return;

      setConfirmingAttendance(true);

      try {
        const { error } = await supabase
          .from("event_registrations")
          .update({
            attendance_confirmed: false,
            attendance_confirmed_at: null,
          })
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error canceling attendance:", error);
          toast.error("Erro ao cancelar presença");
          return;
        }

        setHasConfirmedAttendance(false);
        toast.success("Confirmação de presença cancelada");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao cancelar presença");
      } finally {
        setConfirmingAttendance(false);
      }
    }, "cancelar presença");
  };

  const handleEndEvent = async () => {
    if (!eventId) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({
          is_live: false,
          status: "completed",
        })
        .eq("id", eventId);

      if (error) {
        console.error("Error ending event:", error);
        toast.error("Erro ao encerrar evento");
        return;
      }

      toast.success("Evento encerrado com sucesso!");
      // Refresh page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao encerrar evento");
    }
  };

  const handleFindFriendsClick = () => {
    requireAuth(() => {
      if (onFindFriends) onFindFriends();
    }, "encontrar amigos");
  };

  const handleShare = async () => {
    if (!eventId || !event) {
      toast.error("Evento não encontrado");
      return;
    }

    // Para platform events, usar um formato de URL diferente
    if (event.is_platform_event) {
      const eventUrl = `${getPublicBaseUrl()}/platform-event/${eventId}`;

      try {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title: event.title,
            text: `Confira este evento: ${event.title}`,
            url: eventUrl,
          });
          toast.success("Evento compartilhado!");
          return;
        }
      } catch (error) {
        // Ignora e tenta fallback
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(eventUrl);
          toast.success("Link copiado para a área de transferência!");
          return;
        }
      } catch (error) {
        // Ignora e tenta próximo fallback
      }

      try {
        const textarea = document.createElement("textarea");
        textarea.value = eventUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (successful) {
          toast.success("Link copiado!");
          return;
        }
      } catch (error) {
        // Ignora e tenta último recurso
      }

      try {
        window.prompt("Copie o link do evento:", eventUrl);
        toast.info("Link exibido para copiar.");
      } catch (error) {
        toast.error("Não foi possível gerar o link automaticamente.");
      }
      return;
    }

    // Usar formato simples com ID do evento
    const eventUrl = `${getPublicBaseUrl()}/e/${eventId}`;

    // 1) Tenta compartilhamento nativo
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: event.title,
          text: `Confira este evento: ${event.title}`,
          url: eventUrl,
        });
        toast.success("Evento compartilhado!");
        return;
      }
    } catch (error) {
      // Ignora e tenta fallback
    }

    // 2) Tenta copiar via Clipboard API (requer contexto seguro)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(eventUrl);
        toast.success("Link copiado para a área de transferência!");
        return;
      }
    } catch (error) {
      // Ignora e tenta próximo fallback
    }

    // 3) Fallback legado usando document.execCommand('copy')
    try {
      const textarea = document.createElement("textarea");
      textarea.value = eventUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (successful) {
        toast.success("Link copiado!");
        return;
      }
    } catch (error) {
      // Ignora e tenta último recurso
    }

    // 4) Último recurso: exibe prompt para o usuário copiar manualmente
    try {
      window.prompt("Copie o link do evento:", eventUrl);
      toast.info("Link exibido para copiar.");
    } catch (error) {
      toast.error("Não foi possível gerar o link automaticamente.");
    }
  };

  // Verificar se o evento já foi reivindicado
  const [eventClaimStatus, setEventClaimStatus] = useState<{claimed: boolean, alreadyCreated: boolean}>({claimed: false, alreadyCreated: false});

  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!eventId || !organizerId || !event?.is_platform_event) return;

      try {
        // Verificar se existe um evento criado para este organizador baseado no platform_event
        const { data: createdEvent } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', organizerId)
          .eq('title', event.title)
          .maybeSingle();

        if (createdEvent) {
          setEventClaimStatus({claimed: true, alreadyCreated: true});
          return;
        }

        // Verificar se já existe uma solicitação aprovada
        const { data: existingRequest } = await supabase
          .from("event_claim_requests")
          .select("id, status")
          .eq("platform_event_id", eventId)
          .eq("organizer_id", organizerId)
          .maybeSingle();

        if (existingRequest?.status === 'approved') {
          setEventClaimStatus({claimed: true, alreadyCreated: false});
        }
      } catch (error) {
        console.error("Error checking claim status:", error);
      }
    };

    checkClaimStatus();
  }, [eventId, organizerId, event?.is_platform_event, event?.title]);

  const handleClaimEvent = async () => {
    if (!user || !organizerId || !eventId) {
      toast.error("Você precisa ser um organizador para solicitar associação");
      return;
    }

    setRequestingClaim(true);

    try {
      // Verificar se já existe uma solicitação pendente
      const { data: existingRequest } = await supabase
        .from("event_claim_requests")
        .select("id, status")
        .eq("platform_event_id", eventId)
        .eq("organizer_id", organizerId)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          toast.info("Você já tem uma solicitação pendente para este evento");
        } else if (existingRequest.status === "approved") {
          toast.info("Este evento já foi aprovado para você");
          setEventClaimStatus({claimed: true, alreadyCreated: false});
        } else if (existingRequest.status === "rejected") {
          toast.error("Sua solicitação anterior foi rejeitada");
        }
        return;
      }

      // Criar nova solicitação
      const { error } = await supabase.from("event_claim_requests").insert({
        platform_event_id: eventId,
        organizer_id: organizerId,
        message: "Solicitação de associação ao evento",
      });

      if (error) throw error;

      toast.success("Solicitação enviada! Aguarde aprovação do administrador.");
    } catch (error: any) {
      console.error("Error claiming event:", error);
      toast.error("Erro ao solicitar associação: " + error.message);
    } finally {
      setRequestingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <Skeleton className="w-full h-80" />
        </div>
        <div className="px-4 py-6 max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Evento não encontrado</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const hasHeaderImage = Boolean(event.image_url && event.image_url.trim() !== '' && !event.image_url.includes('placeholder.svg'));
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative">
        {hasHeaderImage && (
          <>
            <img src={event.image_url!} alt={event.title} className="w-full h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </>
        )}

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-surface/80 backdrop-blur-sm hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOrganizer && (
            <>
              {event.is_live && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-destructive/90 backdrop-blur-sm hover:bg-destructive"
                  onClick={handleEndEvent}
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Encerrar
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-surface/80 backdrop-blur-sm hover:bg-surface"
                  onClick={() => onEdit(eventId!)}
                >
                  <Edit className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="bg-surface/80 backdrop-blur-sm hover:bg-surface"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Live indicator */}
        {event.is_live && hasHeaderImage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">AO VIVO</span>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Event Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              {event.organizer?.profile?.avatar_url ? (
                <AvatarImage src={event.organizer.profile.avatar_url} />
              ) : (
                <AvatarFallback className="bg-surface">
                  {(event.organizer?.profile?.display_name || event.organizer?.page_title || "O").charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {event.organizer?.profile?.display_name || event.organizer?.page_title || "Organizador"}
              </p>
              <p className="text-sm text-muted-foreground">Organizador</p>
            </div>
          </div>

          {/* Botão de solicitar associação para organizadores - apenas se ainda for platform_event não reivindicado */}
          {event.is_platform_event && isOrganizerUser && !eventClaimStatus.claimed && (
            <div className="mb-4">
              <Button onClick={handleClaimEvent} disabled={requestingClaim} variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                {requestingClaim ? "Enviando..." : "Solicitar Associação"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Você pode solicitar para vincular este evento ao seu perfil de organizador
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-foreground">{formatEventDate(event.event_date)}</span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-foreground">{event.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-foreground">
                {event.unique_attendees_count || 0} {event.is_live ? "pessoas no evento" : "pessoas interessadas"}
              </span>
            </div>
          </div>
        </div>

          {/* Interests */}
        {event.interests && event.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">Meus Interesses</h3>
            <div className="flex flex-wrap gap-2">
              {event.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="default"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2">Sobre o evento</h3>
          <p className="text-muted-foreground leading-relaxed">{event.description || "Sem descrição disponível"}</p>
        </div>

        {/* Public Notes from Organizer */}
        {event.organizer?.profile?.notes && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">Notas do Organizador</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{event.organizer.profile.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {/* Botão de Comprar Ingresso - Link externo */}
          {!isOrganizer && event.ticket_link && (
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={() => window.open(event.ticket_link, "_blank")}
            >
              💳 Comprar Ingresso
            </Button>
          )}

          {/* Botão de Comprar Ingresso - Venda na Plataforma (Stripe) */}
          {!isOrganizer && event.has_platform_tickets && event.ticket_types && event.ticket_types.length > 0 && (
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={() => {
                requireAuth(() => {
                  setTicketDialogOpen(true);
                  trackEvent("InitiateCheckout", {
                    event_name: event?.title,
                    event_id: eventId,
                    value: Math.min(...event.ticket_types!.map(t => t.price)),
                    currency: "BRL"
                  });
                }, "comprar ingressos");
              }}
            >
              💳 Comprar Ingresso - A partir de R$ {Math.min(...event.ticket_types.map(t => t.price)).toFixed(2)}
            </Button>
          )}

          <div className="flex gap-3">
            <Button
              variant={hasConfirmedAttendance ? "outline" : "glow"}
              className="flex-1"
              size="lg"
              onClick={
                isOrganizer && onViewAttendances
                  ? onViewAttendances
                  : hasConfirmedAttendance
                    ? handleCancelAttendance
                    : handleConfirmPresence
              }
              disabled={confirmingAttendance || checkingAttendance}
            >
              {isOrganizer
                ? "Ver Presenças Confirmadas"
                : hasConfirmedAttendance
                  ? "Cancelar Presença"
                  : confirmingAttendance
                    ? "Confirmando..."
                    : "Confirmar Presença"}
            </Button>
            {event.location_link && (
              <Button variant="outline" size="lg" onClick={() => window.open(event.location_link, "_blank")}>
                {isOnlineEvent ? (
                  <>
                    <Video className="h-4 w-4" />
                    Entrar
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Mapa
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Registration button - only if organizer enabled registrations */}
          {event.requires_registration && (
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={isOrganizer && onManageRegistrations ? onManageRegistrations : onRegister}
            >
              <Users className="h-4 w-4 mr-2" />
              {isOrganizer ? "Ver Cadastros no Evento" : "Fazer Cadastro no Evento"}
            </Button>
          )}

          {/* Find Friends button (apenas para eventos ao vivo e usuários comuns) */}
          {event.is_live && !isOrganizer && userRole === "user" && (
            <Button variant="live" className="w-full" size="lg" onClick={handleFindFriendsClick}>
              <Users className="h-4 w-4 mr-2" />
              Encontrar Amigos no Evento
            </Button>
          )}

          {/* End Event button (apenas para organizador em evento ao vivo) */}
          {event.is_live && isOrganizer && (
            <Button variant="destructive" className="w-full" size="lg" onClick={handleEndEvent}>
              <StopCircle className="h-4 w-4 mr-2" />
              Encerrar Evento
            </Button>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between py-4 border-t border-border">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 transition-smooth hover:scale-110" onClick={handleLike}>
              <Heart
                className={`h-5 w-5 ${event.is_liked ? "text-destructive fill-current" : "text-muted-foreground"}`}
              />
              <span className="text-sm text-muted-foreground">{event.likes_count || 0}</span>
            </button>

            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{event.comments_count || 0} comentários</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4 pb-6">
          <h3 className="font-semibold text-foreground">Comentários</h3>

          {/* Add comment */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-surface text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Adicione um comentário..."
                className="min-h-[80px] resize-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button
                variant="glow"
                size="sm"
                className="mt-2"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Comentar
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  {comment.user?.avatar_url ? (
                    <AvatarImage src={comment.user.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-surface text-xs">
                      {(comment.user?.display_name || "U").charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {comment.user?.display_name || "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Seja o primeiro a comentar!</p>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} actionDescription={authModalAction} />

      {/* Ticket Purchase Dialog */}
      {event?.has_platform_tickets && event.ticket_types && ticketSettings && (
        <TicketPurchaseDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          ticketTypes={event.ticket_types}
          ticketSettings={ticketSettings}
          eventId={eventId!}
          eventTitle={event.title}
        />
      )}
    </div>
  );
}
