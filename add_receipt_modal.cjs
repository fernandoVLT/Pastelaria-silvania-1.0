const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const targetStr = `      {/* Hidden Print Component */}`;

const newModalStr = `      {/* Modal for viewing Pix receipt */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <h3 className="font-black text-lg tracking-tight uppercase text-gray-900 mb-4 text-center">Comprovante Pix</h3>
            <div className="w-full h-[60vh] max-h-[500px] overflow-hidden rounded-xl border border-gray-100 flex items-center justify-center bg-gray-50">
               {viewReceiptUrl.startsWith('data:image') || viewReceiptUrl.startsWith('http') ? (
                 <img src={viewReceiptUrl} alt="Comprovante Pix" className="max-w-full max-h-full object-contain" />
               ) : (
                 <p className="text-sm text-gray-500">Erro: Formato de imagem inválido</p>
               )}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}`;

code = code.replace(targetStr, newModalStr);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
