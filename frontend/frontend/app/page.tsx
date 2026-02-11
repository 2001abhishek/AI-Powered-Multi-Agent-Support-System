
import { ChatLayout } from "@/components/chat/chat-layout";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
        <ChatLayout />
      </div>
    </div>
  );
}
