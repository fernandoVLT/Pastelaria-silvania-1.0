import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import toast from 'react-hot-toast';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isFirstLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as Order;
            toast.success(`Novo pedido de ${data.customerName}! (${data.orderType})`, {
              duration: 5000,
              icon: '🛍️',
            });
          }
        });
      }

      const orderList = snapshot.docs.map(doc => ({
        ...doc.data()
      } as Order));
      setOrders(orderList);
      setLoading(false);
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, cancellationReason?: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = { status: newStatus };
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  return { orders, loading, updateOrderStatus };
}
