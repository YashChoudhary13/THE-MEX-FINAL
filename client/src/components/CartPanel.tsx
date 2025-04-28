import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Trash2, X, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const [, navigate] = useLocation();
  const { cart, updateCartItemQuantity, removeFromCart, calculateTotals } = useCart();
  const { toast } = useToast();

  const { subtotal, deliveryFee, tax, total } = calculateTotals();

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add some items before checkout.",
        variant: "destructive",
      });
      return;
    }
    
    onClose();
    navigate("/checkout");
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div 
        className={`overlay absolute inset-0 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      
      <div className={`side-panel absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="border-b p-4 flex justify-between items-center bg-secondary text-white">
            <h2 className="font-heading font-bold text-xl">Your Order</h2>
            <Button variant="ghost" size="icon" className="text-white" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some items to get started</p>
                <Button 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={onClose}
                >
                  Browse Menu
                </Button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex border-b py-4">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-menu font-medium text-secondary">{item.name}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border rounded">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="px-2 py-1 text-gray-500 hover:text-secondary h-auto"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-2 py-1 text-sm">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="px-2 py-1 text-gray-500 hover:text-secondary h-auto"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Cart Summary */}
          <div className="border-t p-4 bg-light">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-secondary pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition mb-2"
                onClick={handleProceedToCheckout}
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </Button>
              <Button 
                variant="outline"
                className="w-full border border-secondary text-secondary hover:bg-secondary hover:text-white font-medium py-2 px-4 rounded-lg transition"
                onClick={onClose}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
