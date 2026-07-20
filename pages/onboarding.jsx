import React, { useState, useEffect } from "react";
import { User, EmergencyContact } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, 
  Users, 
  User as UserIcon,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Zap,
  Target,
  Activity,
  Fingerprint,
  Heart,
  Settings,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_STEPS = [
  { id: 1, title: "Guardian Network", icon: Users, desc: "Emergency Protocol Setup" },
  { id: 2, title: "Identity Core", icon: Fingerprint, desc: "Personal Security Brief" },
  { id: 3, title: "Directives", icon: Settings, desc: "Automation Preferences" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState([
    { name: "", phone: "", relationship: "family" }
  ]);

  const [profileData, setProfileData] = useState({
    emergency_contact_phone: "",
    medical_conditions: "",
    preferred_hospital: ""
  });

  const [preferences, setPreferences] = useState({
    auto_share_location: true,
    voice_activation: true,
    emergency_timeout: 30,
    notification_sms: true,
    notification_email: true
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      await User.loginWithRedirect(window.location.origin + createPageUrl("Onboarding"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: "", phone: "", relationship: "family" }]);
  };

  const handleRemoveContact = (index) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const validContacts = contacts.filter(c => c.name && c.phone);
      for (let i = 0; i < validContacts.length; i++) {
        await EmergencyContact.create({
          ...validContacts[i],
          is_primary: i === 0,
          notify_sms: preferences.notification_sms,
          notify_email: preferences.notification_email
        });
      }

      await User.updateMyUserData({
        ...profileData,
        safety_preferences: preferences,
        onboarding_completed: true
      });

      navigate(createPageUrl("Welcome"));
      
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return contacts.some(c => c.name && c.phone);
      case 2:
        return profileData.emergency_contact_phone;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Deployment sequence...</p>
        </div>
      </div>
    );
  }

  const progress = (currentStep / ONBOARDING_STEPS.length) * 100;
  const currentStepData = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-20 px-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full -mr-96 -mt-96 pointer-events-none"></div>
      
      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
             <Shield className="w-10 h-10 text-white relative z-10" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-black text-slate-900 mb-3 tracking-tighter"
          >
            Tactical Authorization
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium"
          >
            Hello <span className="text-slate-900 italic font-black">{user?.full_name?.split(' ')[0]}</span>. Synchronize your personal security protocols.
          </motion.p>
        </div>

        {/* Tactical Progress Bar */}
        <div className="mb-16">
           <div className="flex items-center justify-between mb-8">
              {ONBOARDING_STEPS.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                     currentStep >= step.id 
                       ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                       : 'bg-white text-slate-300 shadow-sm border border-slate-100'
                   }`}>
                      {currentStep > step.id ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                   </div>
                   <div className="text-center">
                     <p className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-300'}`}>Step {step.id}</p>
                     <p className={`text-[8px] font-bold uppercase tracking-tighter opacity-50 ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-300'}`}>{step.desc}</p>
                   </div>
                </div>
              ))}
              <div className="absolute top-6 left-0 w-full h-px bg-slate-100 -z-0"></div>
           </div>
           <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              />
           </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <Card className="premium-card glass border-white shadow-2xl p-10 bg-white/60">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{currentStepData.title}</h2>
                </div>

              <div className="space-y-8">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <p className="text-slate-500 font-medium italic border-l-2 border-slate-900 pl-4 bg-slate-50/50 py-2 rounded-r-lg">
                      Authorize strategic contacts for immediate cross-protocol SOS alerts.
                    </p>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {contacts.map((contact, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-8 glass-dark rounded-3xl relative overflow-hidden group border-0"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black">
                                  {index + 1}
                               </div>
                               <h4 className="font-black text-white uppercase text-xs tracking-widest">Protocol Node</h4>
                            </div>
                            {index === 0 ? (
                              <div className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                Primary Alpha
                              </div>
                            ) : (
                               <button
                                 onClick={() => handleRemoveContact(index)}
                                 className="text-rose-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                               >
                                 Decommission
                               </button>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Identity</Label>
                              <Input
                                value={contact.name}
                                onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                placeholder="Target name..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-600 font-bold focus:border-white/40 h-12 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Satellite Link</Label>
                              <Input
                                value={contact.phone}
                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                placeholder="+1 (000) 000-0000"
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-600 font-bold focus:border-white/40 h-12 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nexus Relationship</Label>
                              <Select
                                value={contact.relationship}
                                onValueChange={(value) => handleContactChange(index, 'relationship', value)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white font-bold h-12 rounded-xl focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                  <SelectItem value="family">Family Node</SelectItem>
                                  <SelectItem value="friend">Trusted Ally</SelectItem>
                                  <SelectItem value="partner">Strategic Partner</SelectItem>
                                  <SelectItem value="colleague">Associate</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleAddContact}
                      className="w-full h-14 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all text-xs"
                    >
                      Initialize Secondary Node
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <p className="text-slate-500 font-medium italic border-l-2 border-blue-500 pl-4 bg-blue-50/50 py-2 rounded-r-lg">
                      Upload your physiological signatures to optimize rapid response directives.
                    </p>
                    <div className="grid gap-10">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Emergency Target Uplink *</Label>
                        <div className="relative">
                          <Input
                            value={profileData.emergency_contact_phone}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              emergency_contact_phone: e.target.value
                            })}
                            placeholder="Primary response number..."
                            className="pl-12 py-7 glass border-white/80 focus:border-emerald-500/50 rounded-2xl transition-all font-bold text-lg"
                            required
                          />
                          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Biological Conditions</Label>
                           <Input
                             value={profileData.medical_conditions}
                             onChange={(e) => setProfileData({
                               ...profileData,
                               medical_conditions: e.target.value
                             })}
                             placeholder="Conditions/Allergies..."
                             className="py-6 glass border-white/80 focus:border-blue-500/50 rounded-2xl transition-all font-bold"
                           />
                         </div>
                         <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Preferred Med-Base</Label>
                           <Input
                             value={profileData.preferred_hospital}
                             onChange={(e) => setProfileData({
                               ...profileData,
                               preferred_hospital: e.target.value
                             })}
                             placeholder="Medical facility ID..."
                             className="py-6 glass border-white/80 focus:border-indigo-500/50 rounded-2xl transition-all font-bold"
                           />
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-10">
                    <div className="p-6 bg-slate-900 rounded-[2.5rem] flex items-center gap-6 shadow-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 blur-[80px] rounded-full opacity-20 -mr-16 -mt-16"></div>
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-8 h-8 text-emerald-400" />
                       </div>
                       <div>
                          <p className="text-white font-black tracking-tight uppercase text-lg">System Directives</p>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Autonomous Guard Logic</p>
                       </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="premium-card bg-slate-50/50 p-8 border-white rounded-[2rem] space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tactical Features</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 glass border-white rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <MapPin className="w-4 h-4 text-emerald-500" />
                                  <Label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="auto_share">Live Vector Sync</Label>
                               </div>
                               <Checkbox
                                 id="auto_share"
                                 checked={preferences.auto_share_location}
                                 onCheckedChange={(checked) => setPreferences({...preferences, auto_share_location: checked})}
                                 className="w-5 h-5 rounded-md border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                               />
                            </div>
                            <div className="flex items-center justify-between p-4 glass border-white rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <Activity className="w-4 h-4 text-emerald-500" />
                                  <Label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="voice_activation">Acoustic Logic</Label>
                               </div>
                               <Checkbox
                                 id="voice_activation"
                                 checked={preferences.voice_activation}
                                 onCheckedChange={(checked) => setPreferences({...preferences, voice_activation: checked})}
                                 className="w-5 h-5 rounded-md border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                               />
                            </div>
                          </div>
                       </div>

                       <div className="premium-card bg-slate-50/50 p-8 border-white rounded-[2rem] space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Outbound Comms</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 glass border-white rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <Zap className="w-4 h-4 text-blue-500" />
                                  <Label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="notification_sms">Alpha SMS Burst</Label>
                               </div>
                               <Checkbox
                                 id="notification_sms"
                                 checked={preferences.notification_sms}
                                 onCheckedChange={(checked) => setPreferences({...preferences, notification_sms: checked})}
                                 className="w-5 h-5 rounded-md border-blue-500 text-blue-500 focus:ring-blue-500"
                               />
                            </div>
                            <div className="flex items-center justify-between p-4 glass border-white rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <Shield className="w-4 h-4 text-blue-500" />
                                  <Label className="text-xs font-bold text-slate-900 cursor-pointer" htmlFor="notification_email">Secure Email Link</Label>
                               </div>
                               <Checkbox
                                 id="notification_email"
                                 checked={preferences.notification_email}
                                 onCheckedChange={(checked) => setPreferences({...preferences, notification_email: checked})}
                                 className="w-5 h-5 rounded-md border-blue-500 text-blue-500 focus:ring-blue-500"
                               />
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between mt-12 px-2">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              currentStep === 1 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Reverse Step
          </button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="btn-premium btn-primary py-7 px-12 h-auto text-lg shadow-2xl shadow-emerald-500/30"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Deploy...
              </>
            ) : currentStep === 3 ? (
              <>
                Finalize Authorized Setup
                <CheckCircle className="w-6 h-6" />
              </>
            ) : (
              <>
                Confirm Proceed
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Footer System Signal */}
      <div className="mt-20 flex items-center gap-3 opacity-30">
         <Radio className="w-3 h-3 text-slate-900 animate-pulse" />
         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900 italic">Continuous Tactical Monitoring Active</span>
      </div>
    </div>
  );
}

 


