const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { NotificationContainer, notify } from './components/NotificationOverlay';",
  "import { NotificationContainer, notify } from './components/NotificationOverlay';\nimport { VersionUpdater } from './components/VersionUpdater';"
);

code = code.replace(
  "<NotificationContainer />",
  "<VersionUpdater />\n      <NotificationContainer />"
);

fs.writeFileSync('src/App.tsx', code);
