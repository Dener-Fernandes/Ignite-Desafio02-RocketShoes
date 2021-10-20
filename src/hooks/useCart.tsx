import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const stock = await api.get(`/stock/${productId}`);

      const updatedCart = [...cart];
      // Qualquer alteração feita no productFound reflete no updatedCart
      const productFound = updatedCart.find((product) => product.id === productId);
      const currentAmount = productFound ? productFound.amount : 0;
      const newAmount = currentAmount + 1;

      if (newAmount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      if (productFound) {
        productFound.amount = newAmount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productIndex = newCart.findIndex((product) => product.id == productId);
      
      if (productIndex >= 0) {
        const newestCart = newCart.filter((product) => product.id != productId);
        setCart(newestCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newestCart));
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const stock = await api.get(`/stock/${productId}`);
      const prodcutAmount = stock.data.amount;

      if (amount <= 0) {
        return;
      } else {
        if (amount > prodcutAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          // return
        } else {
          const newCart = [...cart];
          const productFound = newCart.find((product) => product.id === productId);
          
          if (productFound) {
            productFound.amount = amount;
            setCart(newCart);
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
          } else {
            throw Error();
          }
        }
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}