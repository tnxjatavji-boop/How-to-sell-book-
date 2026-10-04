const fs = require('fs');
let code = fs.readFileSync('src/screens/LoginScreen.tsx', 'utf8');

code = code.replace(
`                <>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
              )}`,
`                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <span>Create Account & Get ₹97</span>
              )}`
);

code = code.replace(
`            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b067]" /> Firebase Cloud Database
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0088cc]" /> SSL Encrypted
          </div>`,
`            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b067]" /> Firebase Cloud Database
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0088cc]" /> SSL Encrypted
            </span>
          </div>`
);

code = code.replace(
`                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>`,
`                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>I Understand & Agree</span>
              </button>`
);

fs.writeFileSync('src/screens/LoginScreen.tsx', code);
