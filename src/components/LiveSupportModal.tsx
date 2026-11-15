import React, { useState } from 'react';
import {
  X,
  Send,
  Headphones,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface LiveSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onOpenDeposit?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  time: string;
}

const QUICK_QUESTIONS = [
  'বিকাশ ও নগদ ডিপোজিট কতক্ষণে জমা হয়?',
  'টাকা উত্তোলন (Withdraw) করার নিয়ম কি?',
  'Fortune Tiger গেমে বোনাস রাউন্ড কিভাবে পাব?',
  'VIP লেভেল আপ ও ক্যাশব্যাক কীভাবে পাব?',
];

export const LiveSupportModal: React.FC<LiveSupportModalProps> = ({
  isOpen,
  onClose,
  username = 'খেলোয়াড়',
  onOpenDeposit,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      text: `স্বাগতম Babu22 ২৪/৭ লাইভ সাপোর্টে! আমি রুমানা (Customer Care Executive)। কীভাবে আপনাকে সাহায্য করতে পারি?`,
      time: 'এখনই',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: 'এখনই',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Automated smart casino agent responses
    setTimeout(() => {
      let reply = `ধন্যবাদ আপনার মেসেজের জন্য! আমাদের প্রতিনিধি আপনার বিষয়টি পর্যালোচনা করছেন।`;

      if (text.includes('ডিপোজিট') || text.includes('জমা')) {
        reply = `বিকাশ, নগদ এবং রকেটের মাধ্যমে ডিপোজিট ১ থেকে ৩ মিনিটের মধ্যে স্বয়ংক্রিয়ভাবে মূল ব্যালেন্সে জমা হয়ে যায়। কোনো সমস্যা হলে লেনদেনের TrxID আমাদের পাঠান।`;
      } else if (text.includes('উত্তোলন') || text.includes('টাকা তোলা') || text.includes('Withdraw')) {
        reply = `Babu22-তে উত্তোলন অত্যন্ত দ্রুত! আপনার বিকাশ অথবা নগদ একাউন্টে সাধারণত ৫ থেকে ১৫ মিনিটের মধ্যে টাকা ট্রান্সফার সম্পন্ন হয়। ন্যূনতম উত্তোলন ৳১,০০০।`;
      } else if (text.includes('Tiger') || text.includes('টাইগার') || text.includes('স্লট')) {
        reply = `Fortune Tiger একটি ৩x৩ স্লট যাতে র্যান্ডম রিস্পিন ফিচার রয়েছে। পুরো স্ক্রিন পূর্ণ হলে ১০x মাল্টিপ্লায়ার পাওয়া যায়! আপনি ফিচার বাই অপশন দিয়েও সরাসরি বোনাস ট্রিগার করতে পারেন।`;
      } else if (text.includes('VIP') || text.includes('পয়েন্ট') || text.includes('ক্যাশব্যাক')) {
        reply = `প্রতি ৳১,০০০ বাজি ধরলে ভিআইপি পয়েন্ট বাড়ে। ব্রোঞ্জ থেকে সিলভার, গোল্ড ও ডায়মন্ডে পৌঁছালে বিশেষ ডিপোজিট বোনাস ও আনলিমিটেড ক্যাশব্যাক পাবেন!`;
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: reply,
        time: 'এখনই',
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
      sound.playClick();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b101b] border border-amber-500/30 rounded-3xl max-w-lg w-full text-white shadow-2xl relative my-auto animate-fade-in flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Support Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b101b] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Babu22 ২৪/৭ লাইভ চ্যাট</h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  অনলাইন
                </span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <span>রুমানা (ভিআইপি কাস্টমার সার্ভিস)</span>
                <span>•</span>
                <span className="text-amber-400">গড় উত্তর সময়: ৩০ সেকেন্ড</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-full bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick FAQ Chips */}
        <div className="px-3 py-2 bg-slate-900/50 border-b border-gray-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] text-gray-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-700 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700 text-gray-200 rounded-tl-none leading-relaxed'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1 flex items-center gap-1">
                {m.time}
                {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-amber-400" />}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1 text-gray-400 text-xs italic bg-slate-800/50 px-3 py-2 rounded-xl w-fit">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">রুমানা লিখছেন...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-900 border-t border-gray-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="আপনার প্রশ্ন এখানে লিখুন..."
            className="flex-1 bg-slate-950 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="p-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl transition-all font-bold active:scale-95 shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
