import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../lib/supabase';
import { useAetherStore } from '../store/useAetherStore';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, UserPlus, Zap, Loader2, AlertCircle, ArrowRight, RefreshCcw, CheckCircle } from 'lucide-react';

export const AuthUI: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [role, setRole] = useState<'individual' | 'pilot' | 'owner'>('individual');
  const [customId, setCustomId] = useState(''); // Used by Individual
  const [gymName, setGymName] = useState(''); // Used by Owner
  const [pilotCode, setPilotCode] = useState(''); // Used by Pilot
  
  // Owner Specific
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [plan, setPlan] = useState<'basic' | 'pro' | 'elite'>('basic');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<React.ReactNode>(null);
  
  const [pilotValidation, setPilotValidation] = useState<{ isValid: boolean, message: string } | null>(null);

  const validatePilotCode = async () => {
    if (!pilotCode.trim()) {
      setPilotValidation(null);
      return;
    }
    const client = (await import('../lib/supabase')).getSupabase();
    if (!client) return;

    const { data: gym } = await client.from('gyms').select('gym_name').eq('pilot_code', pilotCode).single();
    if (gym) {
      setPilotValidation({ isValid: true, message: `✓ ${gym.gym_name.toUpperCase()} — Node found` });
    } else {
      setPilotValidation({ isValid: false, message: 'Invalid pilot code. Neural connection rejected.' });
    }
  };

  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { isDemoMode, setSession, setUser } = useAetherStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpMode && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpMode, timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(index + pastedOtp.length, 5);
      otpRefs.current[focusIndex]?.focus();
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      verifyOtp();
    }
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
        setError('Incomplete access code.');
        return;
    }
    setLoading(true);
    setError(null);
    
    // Developer Master Bypass for Testing & Friend Sharing
    if (token === '000000') {
      setTimeout(() => {
        const mockUser = {
          id: 'test-user-' + Math.random().toString(16).slice(2),
          email: email,
          user_metadata: { modeSelected: false }
        };
        setSession({ user: mockUser });
        setUser(mockUser);
        setLoading(false);
      }, 1500);
      return;
    }

    try {
        await authService.verifyOtp(email, token);
    } catch (err: any) {
        setError(err.message || 'Invalid Neural Access Code.');
    } finally {
        setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError(null);
    try {
      await authService.resendOtp(email);
      setTimer(60);
      setError('New transmission sent successfully. Check your sector logs.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend transmission.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAuth = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        id: 'demo-user',
        email: 'demo@aether.neural',
        user_metadata: { modeSelected: false }
      };
      setSession({ user: mockUser });
      setUser(mockUser);
      setLoading(false);
    }, 1500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        let finalUsername = '';
        let facilityCode = '';
        
        if (role === 'owner') {
          const prefix = (gymName || 'ATH').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'A');
          const digits = Math.floor(100 + Math.random() * 900);
          facilityCode = `${prefix}-${digits}`;
          finalUsername = gymName;
        } else if (role === 'pilot') {
          finalUsername = `PILOT_${pilotCode}`;
        } else if (role === 'individual') {
          if (customId && customId.length >= 3) {
            const clean = customId
              .toUpperCase()
              .replace(/[^A-Z0-9_]/g, '')
              .substring(0, 12);
            const digits3 = Math.floor(Math.random() * 900 + 100).toString();
            finalUsername = '@' + clean + '_' + digits3;
          } else {
            const elements = ['OXYGEN','CARBON','NEON','ARGON','XENON','NOVA','NEXUS','HELIUM'];
            const el = elements[Math.floor(Math.random() * elements.length)];
            const digits = Math.floor(Math.random() * 90000000 + 10000000).toString();
            finalUsername = '@' + el + '_' + digits;
          }
        }

        const limits = role === 'owner' ? (plan === 'basic' ? 50 : plan === 'pro' ? 200 : 9999) : 0;

        let userRole = 'individual';
        if (role === 'owner') {
          userRole = 'gym_owner';
        } else if (role === 'pilot') {
          userRole = 'pilot';
        }

        const authResult = await authService.signUp(email, password, { 
          username: finalUsername, 
          role: userRole,
          gym_name: gymName,
          facility_code: role === 'owner' ? facilityCode : pilotCode,
          is_verified: role === 'owner' ? false : true,
          area: role === 'owner' ? area : undefined,
          pincode: role === 'owner' ? pincode : undefined,
          plan: role === 'owner' ? plan : undefined,
          pilot_limit: limits
        });

        if (role === 'individual' && authResult?.user) {
          const client = (await import('../lib/supabase')).getSupabase();
          if (client) {
            await client.from('profiles').update({
              neural_id: finalUsername,
              role: 'individual',
              is_verified: true
            }).eq('id', authResult.user.id);
          }
        }

        if (role === 'owner') {
          setSuccessMessage(
            <>
              Facility Node Authorized. Your unique Facility Pilot Code is: <br/>
              Share this with your Pilots. Plan: {plan.toUpperCase()} (Max {limits} Pilots).
            </>
          );
          setSuccessCode(facilityCode);
        } else {
          setIsOtpMode(true);
        }
        setTimer(60);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed: Neural interference detected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-obsidian p-4 md:p-8 relative overflow-hidden group">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
           <div className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] bg-cyan-neon/5 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-purple-neon/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel-heavy p-8 md:p-12 relative z-10 border border-white/10 overflow-hidden"
      >
        {/* Subtle Scanline Effect on Modal */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02]" />
        
        <div className="flex flex-col items-center mb-10 relative">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 bg-gradient-to-br from-cyan-neon via-purple-neon to-black rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,243,255,0.2)] border border-white/20"
          >
            <Zap className="w-10 h-10 text-white fill-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-1 font-heading">
            AETHER <span className="text-white/20 font-light">OS</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1px w-4 bg-cyan-neon/30" />
            <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-mono italic">Sector_Gateway_Login</p>
            <div className="h-1px w-4 bg-cyan-neon/30" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isOtpMode ? (
            <motion.form 
              key="auth-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleAuth} 
              className="space-y-5 relative"
            >
              {!isLogin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Entity Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('individual')}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${role === 'individual' ? 'bg-cyan-neon/10 border-cyan-neon shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${role === 'individual' ? 'text-cyan-neon' : 'text-white/40'}`}>Individual</span>
                        <span className="text-[8px] text-white/30 leading-tight font-mono">Personal fitness + deep work</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('pilot')}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${role === 'pilot' ? 'bg-purple-neon/10 border-purple-neon shadow-[0_0_15px_rgba(188,19,254,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${role === 'pilot' ? 'text-purple-neon' : 'text-white/40'}`}>Gym Pilot</span>
                        <span className="text-[8px] text-white/30 leading-tight font-mono">Gym member with pilot code access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('owner')}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${role === 'owner' ? 'bg-[#deff9a]/10 border-[#deff9a] shadow-[0_0_15px_rgba(222,255,154,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${role === 'owner' ? 'text-[#deff9a]' : 'text-white/40'}`}>Gym Owner</span>
                        <span className="text-[8px] text-white/30 leading-tight font-mono">Gym owner / trainer</span>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {role === 'individual' && (
                      <motion.div 
                        key="individual-field"
                        initial={{ opacity: 0, height: 0, y: -10 }} 
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-cyan-neon/50 font-bold ml-1 font-mono">Choose Your Neural ID (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">@</span>
                            <Input
                              type="text"
                              placeholder="e.g. DARKNIGHT"
                              value={customId}
                              onChange={(e) => setCustomId(e.target.value)}
                              maxLength={12}
                              className="bg-cyan-neon/5 border-cyan-neon/20 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono pl-10"
                            />
                          </div>
                          <p className="text-[8px] text-white/30 uppercase mt-1 mb-2">Only letters and numbers. Max 12 characters.</p>
                        </div>
                      </motion.div>
                    )}

                    {role === 'pilot' && (
                      <motion.div 
                        key="pilot-field"
                        initial={{ opacity: 0, height: 0, y: -10 }} 
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-purple-neon/50 font-bold ml-1 font-mono">Pilot Code</label>
                          <Input
                            type="text"
                            placeholder="e.g. OXY-123"
                            value={pilotCode}
                            onChange={(e) => setPilotCode(e.target.value)}
                            onBlur={validatePilotCode}
                            className="bg-purple-neon/5 border-purple-neon/20 focus:border-purple-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono"
                            required={role === 'pilot'}
                          />
                          {pilotValidation ? (
                            <p className={`text-[9px] font-bold uppercase mt-1 mb-2 font-mono tracking-widest ${pilotValidation.isValid ? 'text-[#deff9a]' : 'text-red-500'}`}>
                              {pilotValidation.message}
                            </p>
                          ) : (
                            <p className="text-[8px] text-white/30 uppercase mt-1 mb-2 font-mono">Enter the pilot code provided by your gym.</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {role === 'owner' && (
                      <motion.div 
                        key="owner-field"
                        initial={{ opacity: 0, height: 0, y: -10 }} 
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#deff9a]/50 font-bold ml-1 font-mono">Gym Name</label>
                          <Input
                            type="text"
                            placeholder="e.g. OXYGEN"
                            value={gymName}
                            onChange={(e) => setGymName(e.target.value)}
                            className="bg-[#deff9a]/5 border-[#deff9a]/20 focus:border-[#deff9a]/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono"
                            required={role === 'owner'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-[#deff9a]/50 font-bold ml-1 font-mono">Area</label>
                            <Input
                              type="text"
                              placeholder="e.g. DLF Phase 1"
                              value={area}
                              onChange={(e) => setArea(e.target.value)}
                              className="bg-[#deff9a]/5 border-[#deff9a]/20 focus:border-[#deff9a]/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono"
                              required={role === 'owner'}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-[#deff9a]/50 font-bold ml-1 font-mono">Pin Code</label>
                            <Input
                              type="text"
                              placeholder="e.g. 122002"
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                              className="bg-[#deff9a]/5 border-[#deff9a]/20 focus:border-[#deff9a]/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono"
                              required={role === 'owner'}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase tracking-widest text-[#deff9a]/50 font-bold ml-1 font-mono">Subscription Plan</label>
                           <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setPlan('basic')}
                                className={`h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${plan === 'basic' ? 'bg-[#deff9a]/20 border-[#deff9a] text-[white]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                              >
                                Basic <br/><span className="text-[8px] font-mono font-normal opacity-70">50 Pilots</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPlan('pro')}
                                className={`h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${plan === 'pro' ? 'bg-[#deff9a]/20 border-[#deff9a] text-[white]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                              >
                                Pro <br/><span className="text-[8px] font-mono font-normal opacity-70">200 Pilots</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPlan('elite')}
                                className={`h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${plan === 'elite' ? 'bg-[#deff9a]/20 border-[#deff9a] text-[white]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                              >
                                Elite <br/><span className="text-[8px] font-mono font-normal opacity-70">Unlimited</span>
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Neural Bridge ID (Email)</label>
                <Input
                  type="email"
                  placeholder="pilot@aether.neural"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Secure Encryption (Password)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono text-lg"
                  required
                />
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl text-xs flex items-start gap-3 font-mono leading-relaxed relative overflow-hidden ${error.includes('sent') ? 'bg-cyan-neon/5 text-cyan-neon border border-cyan-neon/50' : 'bg-red-500/5 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${error.includes('sent') ? 'bg-cyan-neon' : 'bg-red-500'} animate-pulse`} />
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${isLogin ? 'bg-cyan-neon text-black shadow-[0_0_40px_rgba(0,243,255,0.2)]' : 'bg-purple-neon text-white shadow-[0_0_40px_rgba(188,19,254,0.2)]'}`}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? <LogIn className="w-4 h-4 translate-y-[-1px]" /> : <UserPlus className="w-4 h-4 translate-y-[-1px]" />}
                    {isLogin ? 'Initiate System Access' : 'Register New Node'}
                  </span>
                )}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              </Button>

              {isDemoMode && (
                <Button
                  type="button"
                  onClick={handleDemoAuth}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-14 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  Skip Authentication (Local_Demo)
                </Button>
              )}
            </motion.form>
          ) : (
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-heading tracking-widest uppercase text-white">Neural Access Code</h3>
                <p className="text-white/40 text-xs font-mono">Transmission sent to <span className="text-cyan-neon">{email}</span></p>
                <div className="p-2 border border-dashed border-cyan-neon/30 bg-cyan-neon/5 rounded mt-2 inline-block">
                   <p className="text-[10px] text-cyan-neon font-mono uppercase">Testing Mode Active: Use Code <strong className="text-white">000000</strong> to Bypass</p>
                </div>
              </div>

              <div className="flex justify-center gap-2 sm:gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-14 sm:w-12 sm:h-16 bg-black/50 border border-white/10 focus:border-cyan-neon focus:shadow-[0_0_20px_rgba(0,243,255,0.3)] rounded-xl text-center text-xl font-mono text-cyan-neon transition-all outline-none"
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl text-xs flex items-start gap-3 font-mono leading-relaxed relative overflow-hidden ${error.includes('sent') ? 'bg-cyan-neon/5 text-cyan-neon border border-cyan-neon/50' : 'bg-red-500/5 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${error.includes('sent') ? 'bg-cyan-neon' : 'bg-red-500'} animate-pulse`} />
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <Button
                  onClick={verifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full h-16 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all bg-cyan-neon text-black shadow-[0_0_40px_rgba(0,243,255,0.2)] disabled:opacity-50 disabled:shadow-none relative overflow-hidden group/btn"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verify Code <ArrowRight className="w-4 h-4 translate-y-[-1px]" />
                    </span>
                  )}
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                </Button>

                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || timer > 0}
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {timer > 0 ? `Resend Transmission in ${timer}s` : 'Resend Transmission'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex flex-col items-center gap-4 relative">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[9px] text-white/30 hover:text-white transition-colors font-mono uppercase tracking-[0.1em] underline underline-offset-4"
          >
            {isLogin ? "Neural records missing? Register Identity" : "Identity confirmed? Access Gateway"}
          </button>
          
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          <p className="text-white/10 text-[8px] font-mono tracking-widest uppercase text-center">
            Encryption: 1024-bit Quantum <br />
            Node: AF-09 | Sync: Optimal
          </p>
        </div>
      </motion.div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {successCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-panel-heavy p-8 border border-cyan-neon/30 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-neon to-transparent animate-pulse" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-cyan-neon/10 rounded-full flex items-center justify-center border border-cyan-neon/50 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                  <CheckCircle className="w-8 h-8 text-cyan-neon" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-heading tracking-widest uppercase text-white">Registration Successful</h3>
                  <div className="text-white/40 text-[10px] font-mono leading-relaxed uppercase">
                    {successMessage || "Neural Node Authorized. Your unique key is:"}
                  </div>
                </div>

                <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 group cursor-pointer hover:border-cyan-neon/50 transition-all">
                  <div className="text-xl md:text-2xl font-black font-mono text-cyan-neon tracking-widest text-center truncate">
                    {successCode}
                  </div>
                  <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] mt-2 group-hover:text-cyan-neon/50 transition-colors">
                    Secure Connection Key
                  </p>
                </div>

                <p className="text-white/40 text-[9px] font-mono leading-relaxed italic max-w-[240px]">
                  Store this key securely.
                </p>

                <Button
                  onClick={() => {
                    setSuccessCode(null);
                    setIsOtpMode(true);
                  }}
                  className="w-full h-12 bg-cyan-neon text-black font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.2)]"
                >
                  Enter System Gateway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
