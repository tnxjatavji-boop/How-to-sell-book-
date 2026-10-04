const fs = require('fs');
let code = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');

if (!code.includes("triggerHaptic")) {
  code = code.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { triggerHaptic } from '../utils/haptics';");
  
  // Try to find the import block to add it if motion is not there.
  if (!code.includes("import { triggerHaptic }")) {
      code = code.replace("import { Link, useNavigate } from 'react-router-dom';", "import { Link, useNavigate } from 'react-router-dom';\nimport { triggerHaptic } from '../utils/haptics';\nimport { motion } from 'motion/react';");
  }

  // add haptic to copy
  code = code.replace("const copyReferral = async () => {", "const copyReferral = async () => {\n    triggerHaptic('success');");
  
  // add haptic to logout
  code = code.replace("const handleLogout = async () => {", "const handleLogout = async () => {\n    triggerHaptic('heavy');");

  fs.writeFileSync('src/screens/ProfileScreen.tsx', code);
  console.log("Haptics added to ProfileScreen");
}
