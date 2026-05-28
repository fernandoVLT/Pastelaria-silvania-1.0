import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// A Hostinger injeta a porta necessária via process.env.PORT
const PORT = process.env.PORT || 3000;

// Servir os arquivos estáticos da compilação do React (pasta 'dist')
app.use(express.static(join(__dirname, 'dist')));

// Redirecionar todas as outras requisições para o index.html (para o React Router funcionar)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// A Hostinger requer que a aplicação escute nesta porta
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
