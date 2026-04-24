import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAetherStore } from "../store/useAetherStore";
import { authService } from "../lib/supabase";
import { LogOut, User, CreditCard, Settings, Terminal } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";

export const UserMenu: React.FC = () => {
  const { session, setUser, setSession, setDemoMode } = useAetherStore();
  const [showProfile, setShowProfile] = React.useState(false);
  
  if (!session?.user) return null;

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      // Ignore signOut errors if not properly configured
    }
    setDemoMode(false);
    setUser(null);
    setSession(null);
    window.location.reload(); // Hard reset for clean slate
  };

  const userEmail = session.user.email || 'AETHER_PILOT';
  const initial = userEmail.charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <span className="flex items-center gap-3 p-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <Avatar className="h-8 w-8 border border-cyan-neon/30">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${userEmail}`} />
              <AvatarFallback className="bg-cyan-neon text-black font-bold text-xs">{initial}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-mono font-bold tracking-widest text-white/60 pr-2 uppercase">
              {userEmail.split('@')[0]}
            </span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-obsidian/95 backdrop-blur-xl border-white/10 text-white">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/40">Identity Node</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem onClick={() => setShowProfile(true)} className="hover:bg-cyan-neon/10 focus:bg-cyan-neon/10 cursor-pointer">
            <User className="mr-2 h-4 w-4 text-cyan-neon" />
            <span className="text-xs">Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-cyan-neon/10 focus:bg-cyan-neon/10 cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4 text-cyan-neon" />
            <span className="text-xs">Subscription Interface</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem onClick={handleLogout} className="hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-xs uppercase font-bold">Terminate Session</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-obsidian/95 backdrop-blur-2xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase mb-2">Subject Configuration</DialogTitle>
            <DialogDescription className="text-white/40 font-mono text-[10px] uppercase">
              Managing secure identity and resource allocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                <span>Access Level</span>
                <span className="text-cyan-neon font-bold">LEGACY_CITIZEN</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                <span>Neural Bandwidth</span>
                <span className="text-cyan-neon font-bold">1.2 GB/s</span>
              </div>
              <div className="h-[1px] bg-white/5" />
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-tight">Active Subscription</span>
                 </div>
                 <Badge className="bg-cyan-neon text-black text-[8px]">PRO_OS</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">Terminal Output</h4>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 h-24 overflow-y-auto font-mono text-[9px] text-cyan-neon/60">
                <div>[SYSTEM] Local node optimization sync: COMPLETE</div>
                <div>[SYSTEM] Encrypted identity verified via Supabase_Gateway</div>
                <div>[SYSTEM] Subscription status check... OK</div>
                <div className="animate-pulse">_</div>
              </div>
            </div>

            <Button onClick={() => setShowProfile(false)} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl uppercase text-[10px] font-bold">
              Return to HUD
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
