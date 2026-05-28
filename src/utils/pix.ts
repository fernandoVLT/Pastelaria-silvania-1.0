export function generatePixCode(key: string, name: string, city: string, amount?: number): string {
  // Helpers
  const formatLength = (val: string) => val.length.toString().padStart(2, '0');
  const addField = (id: string, value: string) => `${id}${formatLength(value)}${value}`;

  // 00 - Payload Format Indicator (01)
  const payloadFormat = addField('00', '01');
  
  // 26 - Merchant Account Information
  // 00 - GUI
  // 01 - PIX Key
  const gui = addField('00', 'br.gov.bcb.pix');
  const pixKey = addField('01', key);
  const merchantAccount = addField('26', gui + pixKey);
  
  // 52 - Merchant Category Code (0000)
  const merchantCategory = addField('52', '0000');
  
  // 53 - Transaction Currency (986 - BRL)
  const transactionCurrency = addField('53', '986');
  
  // 54 - Transaction Amount (optional, but standard for checkout)
  let transactionAmount = '';
  if (amount !== undefined && amount > 0) {
    transactionAmount = addField('54', amount.toFixed(2));
  }
  
  // 58 - Country Code (BR)
  const countryCode = addField('58', 'BR');
  
  // 59 - Merchant Name (max 25 chars)
  // Remove accents and special chars
  const formattedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z a-z]/g, '').substring(0, 25).trim() || 'RECEBEDOR';
  const merchantName = addField('59', formattedName);
  
  // 60 - Merchant City (max 15 chars)
  const formattedCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z a-z]/g, '').substring(0, 15).trim() || 'CIDADE';
  const merchantCity = addField('60', formattedCity);
  
  // 62 - Additional Data Field Template
  // 05 - Reference Label
  const referenceLabel = addField('05', '***');
  const additionalData = addField('62', referenceLabel);
  
  // Combine payload to calculate CRC16
  const payloadToHash = payloadFormat + merchantAccount + merchantCategory + transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalData + '6304';
  
  // Calculate CRC16 (CCITT-FALSE)
  function crc16(str: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
        crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  const crc = crc16(payloadToHash);
  
  return payloadToHash + crc;
}
