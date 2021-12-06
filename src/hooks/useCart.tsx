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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  

  const addProduct = async (productId: number) => {
    try {
      const {data} = await api.get<Stock>(`/stock/${productId}`);
      
      
      const productExists = cart.find(product => product.id === productId);
      let newAmount = 1;
      if ( productExists) {
        newAmount = productExists.amount + 1;
      }
      
      if (data.amount < newAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = newAmount;
        const updatedCart = cart.map(product => 
          product.id === productExists.id ? productExists : product
        )
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        const productResponse = await api.get(`/products/${productId}`);
        const newProduct = {
          ...productResponse.data,
          amount: newAmount
        } as Product;
        const newProductCart = [...cart, newProduct]
        setCart(newProductCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProductCart));
      }
     
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      if (productExists) {
        const updatedCart = cart.filter(product => product.id !== productId)
        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        throw Error();
      } 

      const {data} = await api.get<Stock>(`/stock/${productId}`);
      
      if (data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const productExists = cart.find(product => product.id === productId);
      
    
      if (productExists) {
        productExists.amount = amount;
        const updatedCart = cart.map(product => 
          product.id === productExists.id ? productExists : product
        )
        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
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
