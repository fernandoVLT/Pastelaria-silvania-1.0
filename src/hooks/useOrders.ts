import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { notify } from '../components/NotificationOverlay';

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
            notify.success(`Novo pedido de ${data.customerName}! (${data.orderType})`);
          }
        });
      }

      const orderList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
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
      const updateData: any = { 
        status: newStatus,
        statusLog: arrayUnion({
          status: newStatus,
          timestamp: Date.now(),
          user: 'Atendente'
        })
      };
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const markOrderAsPrinted = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { hasBeenPrinted: true });
    } catch (error) {
      console.error('Error marking order as printed:', error);
    }
  };

  return { orders, loading, updateOrderStatus, markOrderAsPrinted };
}
