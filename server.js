import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// A Hostinger injeta a porta necessária via process.env.PORT
const PORT = process.env.PORT || 3000;

app.post('/api/bb-pix', async (req, res) => {
  try {
    const { amount, bbPixConfig, txid } = req.body;
    
    if (!bbPixConfig || !bbPixConfig.enabled || (!bbPixConfig.clientId && !bbPixConfig.clientSecret)) {
      return res.status(400).json({ error: 'Configuração do Banco do Brasil não definida ou incompleta.' });
    }

    const { clientId, clientSecret, developerAppKey, isProduction } = bbPixConfig;
    const authUrl = isProduction ? 'https://oauth.bb.com.br/oauth/token' : 'https://oauth.sandbox.bb.com.br/oauth/token';
    const baseUrl = isProduction ? 'https://api.bb.com.br/pix/v2' : 'https://api.sandbox.bb.com.br/pix/v2';
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Obter Token
    const tokenRes = await fetch(authUrl + '?gw-app-key=' + developerAppKey, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=cob.write cob.read pix.read'
    });
    
    if (!tokenRes.ok) {
      console.error('BB Token erro:', await tokenRes.text());
      return res.status(tokenRes.status).json({ error: 'Erro ao autenticar com Banco do Brasil.' });
    }
    
    const { access_token } = await tokenRes.json();
    
    // Gerar Cobrança (cob)
    const cobBody = {
      calendario: { expiracao: 3600 },
      valor: { original: amount.toFixed(2) },
      chave: "Sua_Chave_Pix_Aqui", // Na API Sandbox do BB pode ser um email ou aleatória válida
      solicitacaoPagador: "Pedido Delivery"
    };

    const cobRes = await fetch(`${baseUrl}/cob/${txid || ''}?gw-app-key=${developerAppKey}`, {
      method: txid ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cobBody)
    });

    if (!cobRes.ok) {
      console.error('BB Cob erro:', await cobRes.text());
      return res.status(cobRes.status).json({ error: 'Erro ao criar cobrança PIX no Banco do Brasil.' });
    }

    const cobData = await cobRes.json();
    
    // Para simplificar no MVP/Sandbox e evitar problemas com mTLS, vamos retornar o EMV (BRCode)
    return res.json({ 
      txid: cobData.txid, 
      brcode: cobData.pixCopiaECola || cobData.location || "000201010211...", // Placeholder fallback for sandbox
      status: cobData.status 
    });

  } catch (error) {
    console.error('Erro na API BB Pix:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao gerar PIX do BB.' });
  }
});

app.post('/api/bb-pix-status', async (req, res) => {
  try {
    const { txid, bbPixConfig } = req.body;
    
    if (!bbPixConfig || !bbPixConfig.enabled || (!bbPixConfig.clientId && !bbPixConfig.clientSecret)) {
      return res.status(400).json({ error: 'Configuração do Banco do Brasil não definida.' });
    }

    const { clientId, clientSecret, developerAppKey, isProduction } = bbPixConfig;
    const authUrl = isProduction ? 'https://oauth.bb.com.br/oauth/token' : 'https://oauth.sandbox.bb.com.br/oauth/token';
    const baseUrl = isProduction ? 'https://api.bb.com.br/pix/v2' : 'https://api.sandbox.bb.com.br/pix/v2';
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenRes = await fetch(authUrl + '?gw-app-key=' + developerAppKey, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=cob.read pix.read'
    });
    
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: 'Erro ao autenticar com Banco do Brasil.' });
    }
    
    const { access_token } = await tokenRes.json();
    
    const cobRes = await fetch(`${baseUrl}/cob/${txid}?gw-app-key=${developerAppKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!cobRes.ok) {
      return res.status(cobRes.status).json({ error: 'Erro ao obter status do PIX.' });
    }

    const cobData = await cobRes.json();
    return res.json({ status: cobData.status }); // "ATIVA" or "CONCLUIDA"
  } catch (error) {
    console.error('Erro get PIX status:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao consultar PIX.' });
  }
});

app.post('/api/abacatepay', async (req, res) => {
  try {
    const { amount, customerName, customerPhone, items } = req.body;
    
    if (!process.env.ABACATEPAY_API_KEY) {
      return res.status(500).json({ error: 'Configuração do AbacatePay ausente no servidor.' });
    }

    const priceCents = Math.round(amount * 100);

    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
          {
            externalId: "pedido_geral",
            name: "Pedido Food Delivery",
            quantity: 1,
            price: priceCents,
            description: items ? items.map((i) => `${i.quantity}x ${i.productName}`).join(', ') : "Pedido no Delivery"
          }
        ],
        returnUrl: "https://abacatepay.com",
        completionUrl: "https://abacatepay.com",
        customer: {
          name: customerName || "Cliente Generico",
          email: "cliente@delivery.com",
          cellphone: customerPhone?.replace(/\D/g, '') || "31999999999"
        }
      })
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('AbacatePay erro:', errorText);
      return res.status(abacateResponse.status).json({ error: 'Erro ao gerar PIX com AbacatePay.', details: errorText });
    }

    const abacateData = await abacateResponse.json();
    return res.json(abacateData);
  } catch (error) {
    console.error('Erro na API abacatepay:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir os arquivos estáticos da compilação do React (pasta 'dist')
    app.use(express.static(join(__dirname, 'dist')));

    // Redirecionar todas as outras requisições para o index.html (para o React Router funcionar)
    app.get('*all', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  }

  // A Hostinger requer que a aplicação escute nesta porta
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
