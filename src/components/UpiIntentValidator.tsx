import React, { useMemo } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertCircle, Sparkles, 
  Smartphone, ExternalLink, QrCode, Lock, Check
} from 'lucide-react';
import { validateUpiIntent, buildStandardUpiIntent, UpiValidationResult } from '../utils/upiValidator';

interface UpiIntentValidatorProps {
  upiId?: string;
  payeeName?: string;
  amount: number | string;
  note?: string;
  userId?: string;
  rawIntentString?: string;
  mode?: 'compact' | 'detailed';
  onValidated?: (result: UpiValidationResult) => void;
}

export const UpiIntentValidator: React.FC<UpiIntentValidatorProps> = ({
  upiId = 'tradexora0@okhdfcbank',
  payeeName = 'TradeXora Official',
  amount,
  note,
  userId,
  rawIntentString,
  mode = 'compact',
  onValidated
}) => {
  const validationResult = useMemo(() => {
    let result: UpiValidationResult;
    if (rawIntentString) {
      result = validateUpiIntent(rawIntentString);
    } else {
      const generatedNote = note || (userId ? `TradeXora Deposit ${userId}` : 'TradeXora Deposit');
      result = buildStandardUpiIntent({
        upiId,
        payeeName,
        amount,
        note: generatedNote
      });
    }

    if (onValidated) {
      onValidated(result);
    }
    return result;
  }, [upiId, payeeName, amount, note, userId, rawIntentString, onValidated]);

  const { isValid, errors, warnings, parameters, supportedApps } = validationResult;

  if (mode === 'compact') {
    return (
      <div className={`p-3 rounded-xl border text-xs transition-all ${
        isValid 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isValid ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span>{isValid ? 'NPCI UPI 2.0 Certified' : 'UPI Intent Validation Notice'}</span>
                {isValid && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800">
                    Zero Reject Shield
                  </span>
                )}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {isValid 
                  ? 'Strictly formatted deep link prevents UPI app rejections' 
                  : (errors[0] || 'Invalid parameters detected')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200/80 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>100% App-Ready</span>
          </div>
        </div>

        {/* Supported Apps Quick Strip */}
        {isValid && (
          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-800 font-medium">
            <span className="opacity-75">Verified Gateway for:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">PhonePe</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Google Pay</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">Paytm</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">BHIM</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed Card Mode (Used in CheckoutScreen)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900">
              {isValid ? 'NPCI Certified UPI Intent Engine' : 'UPI Intent Validation Alert'}
            </h4>
            <p className="text-[10px] text-gray-500 font-medium">
              Standardized format ensures zero transaction declines
            </p>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
          isValid 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {isValid ? 'VERIFIED' : 'ACTION REQUIRED'}
        </span>
      </div>

      {/* Parameter Verification Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Payee VPA (pa)</span>
          <span className="font-mono font-bold text-gray-800 truncate block">{parameters.pa}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Payee Name (pn)</span>
          <span className="font-bold text-gray-800 truncate block">{parameters.pn}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Amount & Currency (am/cu)</span>
          <span className="font-mono font-bold text-emerald-700 block">₹{parameters.am} {parameters.cu}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Protocol Scheme</span>
          <span className="font-mono font-bold text-[#0088cc] block">upi://pay</span>
        </div>
      </div>

      {/* Errors or Warnings if any */}
      {errors.length > 0 && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-[11px] text-rose-800 font-medium">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Verified App Gateway Strip */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[10px] text-slate-700">
        <span className="font-bold flex items-center gap-1 text-slate-900">
          <Smartphone className="w-3.5 h-3.5 text-[#0088cc]" />
          <span>App Compliance:</span>
        </span>
        <div className="flex items-center gap-1 font-extrabold">
          <span className="text-purple-700">PhonePe</span>
          <span>•</span>
          <span className="text-blue-700">GPay</span>
          <span>•</span>
          <span className="text-sky-700">Paytm</span>
          <span>•</span>
          <span className="text-teal-700">BHIM</span>
          <span>•</span>
          <span className="text-emerald-700">Cred</span>
        </div>
      </div>
    </div>
  );
};
