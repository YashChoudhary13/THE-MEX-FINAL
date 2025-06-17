import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { CartItem } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateCartItemQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoDiscount: number;
  applyPromoCode: (code: string, discount?: number) => Promise<boolean>;
  clearPromoCode: () => void;
  calculateTotals: () => {
    subtotal: number;
    serviceFee: number;
    tax: number;
    discount: number;
    total: number;
  };
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  // Initialize cart from localStorage if available
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  // State for promo code and its discount
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  // Fetch service fee from the backend
  const { data: serviceFeeData } = useQuery({
    queryKey: ["/api/system-settings/service-fee"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/system-settings/service-fee", { signal });
      if (!response.ok) {
        throw new Error("Failed to fetch service fee");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      // Check if the item already exists in the cart
      const existingItemIndex = prevCart.findIndex(
        (item) => item.menuItemId === newItem.menuItemId
      );

      if (existingItemIndex >= 0) {
        // If item exists, update its quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + newItem.quantity,
        };
        return updatedCart;
      } else {
        // If item doesn't exist, add it to the cart
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateCartItemQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    clearPromoCode();
  };

  // Apply promo code and get discount
  const applyPromoCode = async (code: string, discount?: number): Promise<boolean> => {
    if (!code.trim()) {
      clearPromoCode();
      return false;
    }

    // If discount is provided directly, use it
    if (discount !== undefined) {
      setPromoCode(code);
      setPromoDiscount(discount);
      return true;
    }

    try {
      const subtotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      const response = await fetch("/api/validate-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          orderTotal: subtotal,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setPromoCode(code);
        setPromoDiscount(result.discount || 0);
        return true;
      } else {
        clearPromoCode();
        return false;
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      clearPromoCode();
      return false;
    }
  };

  const clearPromoCode = () => {
    setPromoCode("");
    setPromoDiscount(0);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    
    // Dynamic service fee from backend, fallback to 2.99 if not available
    const serviceFee = cart.length > 0 
      ? (serviceFeeData?.serviceFee || 2.99) 
      : 0;
    
    // Calculate tax (10% for this demo)
    const tax = subtotal * 0.1;
    
    // Apply promo discount
    const discount = promoDiscount || 0;
    
    // Calculate total (subtotal + service fee + tax - discount)
    const total = Math.max(0, subtotal + serviceFee + tax - discount);
    
    return {
      subtotal,
      serviceFee,
      tax,
      discount,
      total,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        promoCode,
        setPromoCode,
        promoDiscount,
        applyPromoCode,
        clearPromoCode,
        calculateTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
