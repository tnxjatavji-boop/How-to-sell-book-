const fs = require('fs');
let code = fs.readFileSync('src/screens/AssetSelectorScreen.tsx', 'utf8');

if (!code.includes("import { motion }")) {
    code = code.replace("import { AssetLogo } from '../components/AssetLogo';", "import { AssetLogo } from '../components/AssetLogo';\nimport { motion, AnimatePresence } from 'motion/react';\nimport { triggerHaptic } from '../utils/haptics';");
    
    // Add haptic on select
    code = code.replace(
        "setCurrentAsset(asset);",
        "triggerHaptic('light');\n    setCurrentAsset(asset);"
    );

    code = code.replace(
        "className=\"w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer text-left\"",
        "className=\"w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer text-left\"\n            whileTap={{ scale: 0.98, backgroundColor: '#f8fafc' }}"
    );

    code = code.replace(
        "<button\n            key={asset.id}",
        "<motion.button\n            initial={{ opacity: 0, y: 10 }}\n            animate={{ opacity: 1, y: 0 }}\n            transition={{ delay: index * 0.02, ease: 'easeOut', duration: 0.2 }}\n            key={asset.id}"
    );

    code = code.replace(
        "          </button>\n        ))",
        "          </motion.button>\n        ))"
    );

    fs.writeFileSync('src/screens/AssetSelectorScreen.tsx', code);
    console.log("Upgraded AssetSelector");
}
