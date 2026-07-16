import { Order } from '../types';
import { formatCurrency } from './formatCurrency';

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

class EscPosEncoder {
  buffer: number[] = [];

  init() {
    this.buffer.push(0x1b, 0x40);
  }
  alignCenter() {
    this.buffer.push(0x1b, 0x61, 1);
  }
  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0);
  }
  bold(on: boolean) {
    this.buffer.push(0x1b, 0x45, on ? 1 : 0);
  }
  text(str: string) {
    const cleanStr = removeAccents(str);
    for (let i = 0; i < cleanStr.length; i++) {
      let code = cleanStr.charCodeAt(i);
      if (code > 255) code = 63;
      this.buffer.push(code);
    }
  }
  newline(count = 1) {
    for (let i = 0; i < count; i++) this.buffer.push(0x0a);
  }
  cut() {
    // Feed only 2 lines (about 8mm, the minimum to clear the physical thermal print head)
    // to ensure text clears the cutter with absolute minimal paper consumption!
    this.buffer.push(0x0a, 0x0a);
    
    // Highly compatible cut commands sent back-to-back covering all thermal printer families:
    this.buffer.push(0x1d, 0x56, 0x01);       // 1. GS V 1 (Standard ESC/POS partial cut)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00); // 2. GS V 66 0 (Feed and partial cut)
    this.buffer.push(0x1d, 0x56, 0x00);       // 3. GS V 0 (Standard ESC/POS full cut)
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // 4. GS V 65 0 (Feed and full cut)
    this.buffer.push(0x1b, 0x6d);             // 5. ESC m (Epson/Elgin/Chinese partial cut fallback)
    this.buffer.push(0x1b, 0x69);             // 6. ESC i (Epson/Elgin/Chinese full cut fallback)
    this.buffer.push(0x1b, 0x77);             // 7. ESC w (Bematech native cut fallback)
  }
  encode() {
    return new Uint8Array(this.buffer);
  }
}

export function buildReceipt(order: Order, type: 'kitchen' | 'dispatch') {
  const enc = new EscPosEncoder();
  enc.init();
  
  // Header
  enc.alignCenter();
  enc.bold(true);
  enc.text("Pastelaria da Silvania");
  enc.newline();
  enc.text(`VIA ${type === 'kitchen' ? 'COZINHA' : 'MOTOBOY / ENTREGA'}`);
  enc.newline();
  
  enc.alignLeft();
  enc.bold(false);
  enc.text(`Pedido: #${order.id?.substring(0, 6).toUpperCase()}`);
  enc.newline();
  enc.text(`Data: ${new Date(order.createdAt).toLocaleString()}`);
  enc.newline();
  enc.text(`Cliente: ${order.customerName}`);
  if (order.customerPhone) {
    enc.newline();
    enc.text(`Tel: ${order.customerPhone}`);
  }
  enc.newline();
  enc.text(`Tipo: ${order.orderType}`);
  enc.newline();
  
  // Exibir observações
  if (order.observation) {
    enc.bold(true);
    enc.text(`OBS: ${order.observation}`);
    enc.bold(false);
    enc.newline();
  }
  
  enc.alignCenter();
  enc.text("--------------------------------");
  enc.newline();
  enc.alignLeft();
  
  order.items.forEach(item => {
    enc.bold(true);
    enc.text(`${item.quantity}x `);
    enc.bold(false);
    enc.text(`${item.productName}`);
    if (type === 'dispatch') {
      enc.text(` - ${formatCurrency(item.price * item.quantity)}`);
    }
    enc.newline();
    if (item.category) {
      enc.text(`  [${item.category}]`);
      enc.newline();
    }
  });
  
  if (type === 'dispatch') {
    enc.bold(true);
    enc.text(`Subtotal: ${formatCurrency(order.subtotal)}`);
    enc.newline();
    if (order.deliveryFee > 0) {
      enc.text(`Taxa Entrega: ${formatCurrency(order.deliveryFee)}`);
      enc.newline();
    }
    enc.text(`TOTAL: ${formatCurrency(order.total)}`);
    enc.newline();
    enc.bold(false);
  }
  
  // Endereço e pagamento apenas para a via do Motoboy / Entrega
  if (type === 'dispatch' && order.orderType === 'Delivery' && order.address) {
    enc.alignCenter();
    enc.bold(true);
    enc.text("--- Endereco Entrega ---");
    enc.newline();
    enc.alignLeft();
    enc.bold(false);
    enc.text(`${order.address.street}, ${order.address.number}`);
    enc.newline();
    enc.text(`${order.address.neighborhood}`);
    enc.newline();
    
    if (order.paymentMethod) {
      enc.text(`Pagamento: ${order.paymentMethod}`);
      enc.newline();
    }
  }
  
  if (order.scheduledDate && order.scheduledTime) {
    enc.alignCenter();
    enc.bold(true);
    enc.text(`AGENDADO: ${order.scheduledDate.split('-').reverse().join('/')} as ${order.scheduledTime}`);
    enc.bold(false);
    enc.newline();
  }
  
  enc.cut();
  
  return enc.encode();
}

/**
 * Attempts to print to a connected USB printer
 */
export async function printDirectToUsb(order: Order, usbPrinterConfig?: { vendorId: number; productId: number }): Promise<boolean> {
  const winNav = window.navigator as any;
  if (!winNav.usb) {
    console.warn("WebUSB not supported");
    return false;
  }
  
  try {
    const devices = await winNav.usb.getDevices();
    let device: any = null;
    
    if (usbPrinterConfig) {
      device = devices.find((d: any) => 
        d.vendorId === usbPrinterConfig.vendorId && 
        d.productId === usbPrinterConfig.productId
      );
    }
    
    // Fallback search if no specific match is found
    if (!device) {
      device = devices.find((d: any) => 
        d.vendorId === 1155 || // STMicroelectronics (Elgin/thermal printers vendor)
        d.vendorId === 0x0483 ||
        (d.productName && d.productName.toLowerCase().includes('print'))
      );
    }
    
    // Final fallback: use first available device if no match
    if (!device && devices.length > 0) {
      device = devices[0];
    }
    
    if (!device) {
      console.warn("Nenhuma impressora USB pareada foi encontrada.");
      return false;
    }
    
    if (!device.opened) {
      await device.open();
    }
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    let outEndpoint: any = null;
    let interfaceNumber: number = 0;
    
    // Find the first interface with an OUT endpoint
    for (const iface of device.configuration.interfaces) {
      const alternate = iface.alternates[0] || iface.alternate;
      if (!alternate) continue;
      
      for (const ep of alternate.endpoints) {
        if (ep.direction === 'out') {
          outEndpoint = ep;
          interfaceNumber = iface.interfaceNumber;
          break;
        }
      }
      if (outEndpoint) break;
    }
    
    if (!outEndpoint) {
      console.warn("No USB OUT endpoint found no dispositivo selecionado.");
      return false;
    }
    
    await device.claimInterface(interfaceNumber);
    
    const kitchenReceipt = buildReceipt(order, 'kitchen');
    await device.transferOut(outEndpoint.endpointNumber, kitchenReceipt);
    
    // Give 850ms to allow physical printer cutter to complete before sending next job block
    await new Promise(resolve => setTimeout(resolve, 850));
    
    const dispatchReceipt = buildReceipt(order, 'dispatch');
    await device.transferOut(outEndpoint.endpointNumber, dispatchReceipt);
    
    return true;
  } catch (err) {
    console.error("Direct USB print error:", err);
    return false;
  }
}

/**
 * Request pair new USB printer
 */
export async function requestUsbPrinter() {
  const winNav = window.navigator as any;
  if (!winNav.usb) {
    throw new Error('WebUSB nao e suportado neste navegador.');
  }
  try {
    const device = await winNav.usb.requestDevice({ filters: [] });
    return device;
  } catch(e) {
    throw e;
  }
}
