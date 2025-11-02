import { useState } from "react";
import { ArrowLeft, Plus, Edit3, Trash2, Upload, DollarSign, ShoppingCart, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  available: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

interface OrdersManagementProps {
  onBack: () => void;
  userType?: "user" | "organizer";
  isEventLive?: boolean;
  ordersEnabled?: boolean;
}

export default function OrdersManagement({ onBack, userType = "organizer", isEventLive = true, ordersEnabled = true }: OrdersManagementProps) {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Água 500ml",
      description: "Água mineral natural gelada",
      price: 5.00,
      category: "Bebidas",
      available: true,
      image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=150&h=150&fit=crop",
    },
    {
      id: "2", 
      name: "Cerveja Long Neck",
      description: "Cerveja gelada premium 355ml",
      price: 12.00,
      category: "Bebidas",
      available: true,
      image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=150&h=150&fit=crop",
    },
    {
      id: "3",
      name: "Hambúrguer Artesanal",
      description: "Hambúrguer 200g com queijo, alface e tomate",
      price: 25.00,
      category: "Comidas",
      available: true,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop",
    },
    {
      id: "4",
      name: "Nachos Especial",
      description: "Nachos com guacamole, queijo e jalapeños",
      price: 18.00,
      category: "Comidas",
      available: true,
      image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=150&h=150&fit=crop",
    },
    {
      id: "5",
      name: "Energético",
      description: "Red Bull 250ml gelado",
      price: 8.00,
      category: "Bebidas",
      available: true,
      image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=150&h=150&fit=crop",
    },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });

  const categories = ["Bebidas", "Comidas", "Sobremesas", "Merchandise"];

  // Cart functions for users
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Organizer functions
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", price: "", category: "", image: "" });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Editar produto existente
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? {
              ...p,
              name: formData.name,
              description: formData.description,
              price: parseFloat(formData.price),
              category: formData.category,
              image: formData.image || undefined,
            }
          : p
      ));
    } else {
      // Adicionar novo produto
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image || undefined,
        available: true,
      };
      setProducts(prev => [...prev, newProduct]);
    }

    setIsDialogOpen(false);
    setFormData({ name: "", description: "", price: "", category: "", image: "" });
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Check if orders should be available
  const canOrder = userType === "user" && isEventLive && ordersEnabled;

  // User Menu View (Cardápio)
  if (userType === "user") {
    if (!isEventLive) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between p-4 max-w-md mx-auto">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Cardápio</h1>
              <div className="w-10" />
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[50vh] p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">Evento não está acontecendo</h2>
              <p className="text-muted-foreground">O cardápio estará disponível durante o evento.</p>
            </div>
          </div>
        </div>
      );
    }

    if (!ordersEnabled) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between p-4 max-w-md mx-auto">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Cardápio</h1>
              <div className="w-10" />
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[50vh] p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">Pedidos não disponíveis</h2>
              <p className="text-muted-foreground">O organizador não habilitou pedidos para este evento.</p>
            </div>
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
            <h1 className="text-lg font-semibold text-foreground">Cardápio</h1>
            <div className="relative">
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getCartItemCount()}
                </Badge>
              )}
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto pb-32">
          {/* Menu Items */}
          <div className="space-y-6">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-20 bg-background/80 backdrop-blur-md py-2">
                  {category}
                </h2>
                <div className="space-y-3">
                  {categoryProducts.filter(p => p.available).map((product) => {
                    const cartItem = cart.find(item => item.id === product.id);
                    const quantity = cartItem?.quantity || 0;
                    
                    return (
                      <Card key={product.id} className="p-4">
                        <div className="flex gap-3">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                R$ {product.price.toFixed(2)}
                              </span>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => removeFromCart(product.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <span className="min-w-[2rem] text-center font-medium">
                                    {quantity}
                                  </span>
                                )}
                                <Button
                                  size="icon"
                                  variant={quantity > 0 ? "default" : "outline"}
                                  className="h-8 w-8"
                                  onClick={() => addToCart(product)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    Total: R$ {getCartTotal().toFixed(2)}
                  </p>
                </div>
                <Button className="btn-glow">
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Organizer Management View

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Área de Pedidos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="glow" onClick={handleAddProduct}>
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Adicionar Produto"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Água 500ml"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o produto..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="15.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                    >
                      <option value="">Selecione</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">URL da Imagem (opcional)</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? "Salvar" : "Adicionar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        {/* Estatísticas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {products.filter(p => p.available).length}
                </p>
                <p className="text-xs text-muted-foreground">Disponíveis</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">R$ 150</p>
                <p className="text-xs text-muted-foreground">Vendas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos por Categoria */}
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-foreground mb-3">{category}</h2>
              <div className="space-y-3">
                {categoryProducts.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-primary">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.available 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {product.available ? "Disponível" : "Indisponível"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione produtos para começar a receber pedidos
            </p>
            <Button onClick={handleAddProduct}>
              Adicionar Primeiro Produto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}