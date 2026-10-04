const fs = require('fs');
let code = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');

if (!code.includes("triggerHaptic")) {
    code = code.replace("import { useNavigate, Link } from 'react-router-dom';", "import { useNavigate, Link } from 'react-router-dom';\nimport { triggerHaptic } from '../utils/haptics';\nimport { motion } from 'motion/react';");
    code = code.replace("const copyReferral = () => {", "const copyReferral = () => {\n    triggerHaptic('success');");
    code = code.replace("const handleLogout = () => {", "const handleLogout = () => {\n    triggerHaptic('heavy');");
    fs.writeFileSync('src/screens/ProfileScreen.tsx', code);
    console.log("Fixed Profile");
}
