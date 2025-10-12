import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, MapPin, Grid3x3, Radar, Share2, Calendar, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Conexões Reais",
      description: "Conecte-se com pessoas que compartilham seus interesses e paixões"
    },
    {
      icon: Calendar,
      title: "Eventos na Sua Cidade",
      description: "Descubra eventos incríveis acontecendo perto de você"
    },
    {
      icon: Grid3x3,
      title: "Organizado por Categorias",
      description: "Encontre facilmente eventos por categorias: música, esportes, tecnologia e muito mais"
    },
    {
      icon: Radar,
      title: "Proximidade Inteligente",
      description: "Encontre pessoas e eventos num raio de 100 metros quando estiver próximo"
    },
    {
      icon: Share2,
      title: "Rede Social de Eventos",
      description: "Uma plataforma completa para interação social e descoberta de eventos"
    },
    {
      icon: MapPin,
      title: "Localização em Tempo Real",
      description: "Veja quem está por perto e participe de eventos ao vivo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold gradient-primary bg-clip-text text-[#147dc7]">
            MeetLines
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Conecte-se com pessoas, descubra eventos e viva experiências únicas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              variant="glow" 
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Já tenho conta
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-elevated transition-all hover:-translate-y-1 duration-300"
              >
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center space-y-6 p-8 rounded-2xl bg-primary/5 border border-primary/10">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão conectando-se e descobrindo eventos incríveis na sua cidade
          </p>
          <Button 
            variant="glow" 
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth')}
          >
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-16 pb-8">
          <p className="text-sm text-muted-foreground">
            Desenvolvido pela <a href="https://flatgrowth.com.br/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flat Company</a>
          </p>
        </div>
      </div>
    </div>
  );
}
