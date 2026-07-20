const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf-8');

const targetLabel = `<label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Configuração de Horários por Dia (Fechado fixo às Segundas)</label>`;
const replacementLabel = `<label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Configuração de Horários por Dia</label>`;
code = code.replace(targetLabel, replacementLabel);

const targetCheckbox = `                                    disabled={day === 1} // Segunda fixo
                                    className="w-4 h-4 accent-brand-red cursor-pointer"`;
const replacementCheckbox = `                                    className="w-4 h-4 accent-brand-red cursor-pointer"`;
code = code.replace(targetCheckbox, replacementCheckbox);

const targetButton = `                                <button
                                  type="button"
                                  disabled={!schedule.isOpen || day === 1}`;
const replacementButton = `                                <button
                                  type="button"
                                  disabled={!schedule.isOpen}`;
code = code.replace(targetButton, replacementButton);

fs.writeFileSync('src/components/AdminModal.tsx', code);
