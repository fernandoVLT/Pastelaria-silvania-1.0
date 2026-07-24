const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerOrdersModal.tsx', 'utf-8');

code = code.replace(
  `                    )}
                  </div>
                </div>
              ))}
            </div>`,
  `                    )}
                </div>
              ))}
            </div>`
);
fs.writeFileSync('src/components/CustomerOrdersModal.tsx', code);
