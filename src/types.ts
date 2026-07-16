export interface TimeSlot {
  open: string;
  close: string;
}

export interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

export interface BusinessHours {
  [dayIndex: number]: DaySchedule; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export type Category = string;

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl?: string;
  reviews?: Review[];
  salesCount?: number;
  isBestSeller?: boolean;
  isAvailable?: boolean;
  stock?: number;
  createdAt?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  observation?: string;
}

export type PaymentMethod = 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Vale Alimentação' | 'Dinheiro' | string;

export type OrderStatus = 'Feito' | 'Aguardando Confirmação Pix' | 'Em Preparo' | 'Pronto' | 'A caminho' | 'Entregue' | 'Cancelado';
export type OrderType = 'Delivery' | 'Retirada';

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  category?: string;
  description?: string;
  observation?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone?: string;
  orderType: OrderType;
  observation?: string;
  address?: {
    neighborhood: string;
    street: string;
    number: string;
  };
  paymentMethod: PaymentMethod;
  needsChange?: boolean;
  changeFor?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  scheduledDate?: string;
  scheduledTime?: string;
  cancellationReason?: string;
  hasBeenPrinted?: boolean;
  statusLog?: { status: OrderStatus; timestamp: number; user?: string }[];
}
