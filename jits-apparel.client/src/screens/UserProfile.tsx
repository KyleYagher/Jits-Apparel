import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { User, ShoppingBag, Settings, Mail, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { cart } = useCart();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  if (!user) {
    // Redirect to login if not authenticated
    navigate('login');
    return null;
  }

  const handleSaveProfile = () => {
    updateProfile({ name: editedName });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditedName(user.name);
    setIsEditing(false);
  };


  // Mock order history
  const orderHistory = [
    {
      id: 'ORD-001',
      date: '2026-01-01',
      total: 599.00,
      status: 'Delivered',
      items: 2
    },
    {
      id: 'ORD-002',
      date: '2025-12-15',
      total: 799.00,
      status: 'In Transit',
      items: 3
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--jits-pink) 0%, var(--jits-cyan) 100%)'
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="mb-1">{user.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Your shopping activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="text-2xl">{orderHistory.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cart Items</span>
                    <span className="text-2xl">{cart.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wishlist</span>
                    <span className="text-2xl">0</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.length > 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm">Added {cart.length} item(s) to cart</p>
                        <p className="text-xs text-muted-foreground">Recently</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm">Account created</p>
                      <p className="text-xs text-muted-foreground">Welcome to Jits!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <Card 
              className="border-2"
              style={{
                borderColor: 'var(--jits-pink)',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
              }}
            >
              <CardHeader>
                <CardTitle>Continue Shopping</CardTitle>
                <CardDescription>
                  Discover our latest super cool, funky designs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('shop')}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 50%, var(--jits-cyan) 100%)'
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse Collection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your past and current orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                        <Badge
                          variant={order.status === 'Delivered' ? 'default' : 'secondary'}
                          style={order.status === 'Delivered' ? {
                            backgroundColor: 'var(--jits-cyan)',
                            color: 'white'
                          } : {}}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{order.items} items</span>
                        <span>R {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing}
                    />
                    {isEditing ? (
                      <>
                        <Button
                          size="icon"
                          onClick={handleSaveProfile}
                          style={{
                            backgroundColor: 'var(--jits-cyan)',
                            color: 'white'
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-display">Email</Label>
                  <Input
                    id="email-display"
                    value={user.email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="gap-2">
                  <X className="w-4 h-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}