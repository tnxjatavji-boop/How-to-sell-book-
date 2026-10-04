const fs = require('fs');

let code = fs.readFileSync('src/screens/DepositScreen.tsx', 'utf8');
code = code.replace("import { Copy, useNavigate, Link } from 'react-router-dom';", "import { useNavigate, Link } from 'react-router-dom';");
code = code.replace("import { Copy, useAppContext } from '../context/AppContext';", "import { useAppContext } from '../context/AppContext';");
fs.writeFileSync('src/screens/DepositScreen.tsx', code);
