import { useState } from "react";
import { ArrowLeft, Search, Download, Eye, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock registration data
const mockRegistrations = [
  {
    id: "1",
    name: "Ana Silva",
    email: "ana@email.com",
    phone: "(11) 99999-1111",
    submittedAt: "2024-01-15T10:30:00Z",
    source: "Instagram",
    photo: "/placeholder.svg",
    observations: "Primeira vez no evento, super animada!"
  },
  {
    id: "2", 
    name: "Carlos Santos",
    email: "carlos@email.com",
    phone: "(11) 99999-2222",
    submittedAt: "2024-01-15T14:20:00Z",
    source: "Amigos",
    photo: "/placeholder.svg",
    observations: ""
  },
  {
    id: "3",
    name: "Mariana Costa",
    email: "mariana@email.com", 
    phone: "(11) 99999-3333",
    submittedAt: "2024-01-16T09:15:00Z",
    source: "Facebook",
    photo: "/placeholder.svg",
    observations: "Vegetariana, precisa de opção especial"
  }
];

interface EventRegistrationsProps {
  onBack: () => void;
  eventId?: string;
}

export default function EventRegistrations({ onBack, eventId }: EventRegistrationsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<typeof mockRegistrations[0] | null>(null);

  const filteredRegistrations = mockRegistrations.filter(reg =>
    reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportData = () => {
    // Simulate export functionality
    console.log("Exportando dados dos cadastros...");
  };

  if (selectedRegistration) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between p-4 max-w-md mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setSelectedRegistration(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Detalhes do Cadastro</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto pb-20">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-2">
                <AvatarImage src={selectedRegistration.photo} />
                <AvatarFallback>{selectedRegistration.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <CardTitle>{selectedRegistration.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cadastrado em {new Date(selectedRegistration.submittedAt).toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <p className="text-sm">{selectedRegistration.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="text-sm">{selectedRegistration.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Como soube do evento</label>
                <p className="text-sm">{selectedRegistration.source}</p>
              </div>
              {selectedRegistration.observations && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm">{selectedRegistration.observations}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data do Cadastro</label>
                <p className="text-sm">
                  {new Date(selectedRegistration.submittedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Cadastros</h1>
          <Button variant="ghost" size="icon" onClick={exportData}>
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        {/* Event Summary */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Festival Eletrônico 2024</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                15 Mar 2024
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Club Neon
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{mockRegistrations.length}</div>
                <div className="text-xs text-muted-foreground">Cadastros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">300</div>
                <div className="text-xs text-muted-foreground">Capacidade</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{Math.round((mockRegistrations.length / 300) * 100)}%</div>
                <div className="text-xs text-muted-foreground">Ocupação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Registrations List */}
            <div className="space-y-3">
              {filteredRegistrations.map((registration) => (
                <Card key={registration.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3" onClick={() => setSelectedRegistration(registration)}>
                      <Avatar>
                        <AvatarImage src={registration.photo} />
                        <AvatarFallback>{registration.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{registration.name}</h3>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{registration.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {registration.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(registration.submittedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Origem dos Cadastros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Instagram", "Facebook", "Amigos", "Site"].map((source) => {
                    const count = mockRegistrations.filter(r => r.source === source).length;
                    const percentage = (count / mockRegistrations.length) * 100;
                    return (
                      <div key={source} className="flex items-center justify-between text-sm">
                        <span>{source}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cadastros por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Gráfico em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}