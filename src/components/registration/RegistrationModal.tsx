'use client';

import { useAppStore, SPORTS_LIST, ADVANCED_ROLES, type ProfileTypeId } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, ArrowRight, Check, ChevronRight,
  Users, ShieldCheck, Clock, Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import RoleForms from './RoleForms';

// Simple Fan Registration Form
function SimpleRegistrationForm() {
  const completeSimpleRegistration = useAppStore((s) => s.completeSimpleRegistration);
  const showToast = useAppStore((s) => s.showToast);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const toggleSport = (sport: string) => {
    setSelectedSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !handle.trim()) {
      showToast('Please fill in all fields');
      return;
    }
    if (selectedSports.length === 0) {
      showToast('Please select at least one sport');
      return;
    }
    completeSimpleRegistration({
      name: name.trim(),
      email: email.trim(),
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      sports: selectedSports,
    });
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              s <= step ? 'bg-sport-green text-black' : 'bg-surface border border-surface-border text-muted-foreground'
            }`}>
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            {s < 2 && <div className={`h-0.5 flex-1 rounded-full ${s < step ? 'bg-sport-green' : 'bg-surface-border'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white">Create Your Fan Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Join millions of sports fans worldwide</p>

            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Mbaza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <input
                    type="text"
                    placeholder="davidmbaza"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace('@', ''))}
                    className="w-full rounded-xl bg-surface border border-surface-border pl-8 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!name.trim() || !email.trim() || !handle.trim()) {
                  showToast('Please fill in all fields');
                  return;
                }
                setStep(2);
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sport-green py-3 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white">Pick Your Sports</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select sports you want to follow</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {SPORTS_LIST.map((sport) => (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedSports.includes(sport)
                      ? 'bg-sport-green text-black border border-sport-green'
                      : 'bg-surface border border-surface-border text-muted-foreground hover:text-white hover:border-sport-green/40'
                  }`}
                >
                  {selectedSports.includes(sport) && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                  {sport}
                </button>
              ))}
            </div>

            {selectedSports.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedSports.length} sport{selectedSports.length > 1 ? 's' : ''} selected
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface text-sm font-semibold text-white transition-colors hover:bg-surface-elevated"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sport-green text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Join Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Role Selection for Advanced Registration
function RoleSelectionStep({ onSelectRole }: { onSelectRole: (role: ProfileTypeId) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white">Choose Your Role</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select the profile type that describes you</p>

      <div className="mt-4 flex flex-col gap-2">
        {ADVANCED_ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className="flex items-center gap-3 rounded-xl bg-surface border border-surface-border p-3 text-left transition-all hover:border-sport-green/40 active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-lg">
              {role.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{role.label}</p>
              <p className="text-xs text-muted-foreground truncate">{role.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Advanced Registration Form with role-specific fields
function AdvancedRegistrationForm({ role }: { role: ProfileTypeId }) {
  const completeAdvancedRegistration = useAppStore((s) => s.completeAdvancedRegistration);
  const setRegistrationStep = useAppStore((s) => s.setRegistrationStep);
  const showToast = useAppStore((s) => s.showToast);
  const setSelectedRole = useAppStore((s) => s.setSelectedRole);
  const roleConfig = ADVANCED_ROLES.find(r => r.id === role);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [roleData, setRoleData] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !handle.trim()) {
      showToast('Please fill in all required fields');
      return;
    }
    if (!agreed) {
      showToast('Please agree to the verification terms');
      return;
    }
    completeAdvancedRegistration({
      name: name.trim(),
      email: email.trim(),
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      role,
      roleData,
    });
  };

  return (
    <div>
      <button
        onClick={() => {
          setRegistrationStep('advanced-role');
          setSelectedRole(null);
        }}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to roles
      </button>

      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{roleConfig?.emoji}</span>
        <h2 className="text-lg font-bold text-white">Register as {roleConfig?.label}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{roleConfig?.description}</p>

      {/* Verification Notice */}
      <div className="mb-6 rounded-xl bg-sport-green/5 border border-sport-green/20 p-3.5">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-sport-green flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-sport-green">Admin Verification Required</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your {roleConfig?.label} profile will be reviewed. Once verified, you receive a verified badge on your profile.
            </p>
          </div>
        </div>
      </div>

      {/* Common fields */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{roleConfig?.label} Name *</label>
          <input
            type="text"
            placeholder={`e.g. ${role === 'player' ? 'Marcus Rashford' : role === 'team' ? 'Manchester United' : role === 'academy' ? 'La Masia Academy' : 'Your name'}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email *</label>
          <input
            type="email"
            placeholder="official@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <input
              type="text"
              placeholder="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace('@', ''))}
              className="w-full rounded-xl bg-surface border border-surface-border pl-8 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sport-green transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Role-specific fields */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-white">{roleConfig?.label} Details</h3>
        <RoleForms role={role} data={roleData} onChange={setRoleData} />
      </div>

      {/* Agreement */}
      <label className="mt-6 flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAgreed(!agreed)}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
            agreed ? 'border-sport-green bg-sport-green' : 'border-surface-border bg-surface'
          }`}
        >
          {agreed && <Check className="h-3 w-3 text-black" />}
        </div>
        <span className="text-xs text-muted-foreground leading-relaxed">
          I confirm that the information provided is accurate. I understand my {roleConfig?.label.toLowerCase()} profile 
          will undergo admin verification and a verified badge will be awarded upon approval.
        </span>
      </label>

      <button
        onClick={handleSubmit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sport-green py-3.5 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
      >
        <ShieldCheck className="h-4 w-4" />
        Submit for Verification
      </button>
    </div>
  );
}

// Registration Complete Screen
function RegistrationComplete() {
  const userProfile = useAppStore((s) => s.userProfile);
  const setRegistrationStep = useAppStore((s) => s.setRegistrationStep);
  const isPending = userProfile?.verificationStatus === 'pending';

  return (
    <div className="flex flex-col items-center text-center py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-sport-green mb-4"
      >
        {isPending ? (
          <Clock className="h-8 w-8 text-black" />
        ) : (
          <CheckCircle2 className="h-8 w-8 text-black" />
        )}
      </motion.div>

      <h2 className="text-lg font-bold text-white">
        {isPending ? 'Registration Submitted!' : 'Welcome to SportSphere!'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        {isPending
          ? `Your ${userProfile?.role} profile is being reviewed by our admin team. You'll receive a verified badge once approved.`
          : 'Your fan profile is ready! Start following teams, players, and join the conversation.'
        }
      </p>

      {/* Profile summary card */}
      <div className="mt-6 w-full rounded-2xl bg-surface-elevated border border-surface-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sport-green text-sm font-bold text-black">
            {userProfile?.avatar}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">{userProfile?.name}</p>
              {isPending && (
                <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400 border border-yellow-500/20">
                  <Clock className="h-2.5 w-2.5" />
                  Pending
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{userProfile?.handle}</p>
          </div>
        </div>

        {isPending && (
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Verification badge will appear once approved</span>
            </div>
          </div>
        )}
      </div>

      {/* What's next */}
      <div className="mt-6 w-full rounded-2xl bg-surface border border-surface-border p-4">
        <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">What you can do now</h3>
        <div className="flex flex-col gap-2">
          {isPending ? (
            <>
              {['Complete your profile details', 'Upload verification documents', 'Browse while waiting for approval'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sport-green text-xs">&#10003;</span>
                  <span className="text-xs text-foreground/80">{item}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {['Follow your favorite teams & players', 'Join sports communities', 'Start posting & predicting'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sport-green text-xs">&#10003;</span>
                  <span className="text-xs text-foreground/80">{item}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setRegistrationStep('choose')}
        className="mt-6 w-full rounded-xl bg-sport-green py-3 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
      >
        Go to Profile
      </button>
    </div>
  );
}

// Registration Type Choice
function RegistrationChoiceStep() {
  const setRegistrationStep = useAppStore((s) => s.setRegistrationStep);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);
  const setRegistrationOpen = useAppStore((s) => s.setRegistrationOpen);

  return (
    <div>
      <h2 className="text-lg font-bold text-white">How would you like to join?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose the registration type that fits you</p>

      {/* Simple Fan Registration */}
      <button
        onClick={() => setRegistrationStep('simple')}
        className="mt-6 w-full rounded-2xl bg-surface border border-surface-border p-5 text-left transition-all hover:border-sport-green/40 active:scale-[0.98]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-sport-green">
            <Users className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Fan</h3>
              <span className="rounded-full bg-sport-green/10 px-2 py-0.5 text-[10px] font-medium text-sport-green">Quick</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Simple registration. Pick your sports, follow teams & players, join communities, post predictions, and connect with fans worldwide.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Follow', 'Post', 'Predict', 'Chat'].map(tag => (
                <span key={tag} className="rounded-md bg-surface-elevated px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>

      {/* Advanced Registration */}
      <button
        onClick={() => setRegistrationStep('advanced-role')}
        className="mt-3 w-full rounded-2xl bg-surface border border-surface-border p-5 text-left transition-all hover:border-sport-green/40 active:scale-[0.98]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border">
            <ShieldCheck className="h-6 w-6 text-sport-green" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Advanced</h3>
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">Verified</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Register as Team, Player, Coach, Journalist, or any of 13 specialized roles. Includes admin verification and a verified badge.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Team', 'Player', 'Coach', 'Referee', 'Scout', '+9 more'].map(tag => (
                <span key={tag} className="rounded-md bg-surface-elevated px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>

      {/* Already have account */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => {
              setRegistrationOpen(false);
              setLoginModalOpen(true);
            }}
            className="font-semibold text-sport-green hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

// ====== MAIN EXPORT ======
export default function RegistrationModal() {
  const registrationOpen = useAppStore((s) => s.registrationOpen);
  const setRegistrationOpen = useAppStore((s) => s.setRegistrationOpen);
  const registrationStep = useAppStore((s) => s.registrationStep);
  const setRegistrationStep = useAppStore((s) => s.setRegistrationStep);
  const setSelectedRole = useAppStore((s) => s.setSelectedRole);
  const selectedRole = useAppStore((s) => s.selectedRole);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  if (!registrationOpen || isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex w-full flex-col max-w-lg mx-auto max-h-[92vh] rounded-t-3xl bg-surface-elevated border-t border-surface-border"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-surface-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sport-green">
              <span className="text-xs font-black text-black">SS</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Join SportSphere</h1>
              <p className="text-[10px] text-muted-foreground">Create your profile</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRegistrationOpen(false);
              setRegistrationStep('choose');
              setSelectedRole(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-border"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
          <AnimatePresence mode="wait">
            {registrationStep === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <RegistrationChoiceStep />
              </motion.div>
            )}
            {registrationStep === 'simple' && (
              <motion.div
                key="simple"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SimpleRegistrationForm />
              </motion.div>
            )}
            {registrationStep === 'advanced-role' && (
              <motion.div
                key="advanced-role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <RoleSelectionStep onSelectRole={(role) => {
                  setSelectedRole(role);
                  setRegistrationStep('advanced-form');
                }} />
              </motion.div>
            )}
            {registrationStep === 'advanced-form' && selectedRole && (
              <motion.div
                key="advanced-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AdvancedRegistrationForm role={selectedRole} />
              </motion.div>
            )}
            {registrationStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <RegistrationComplete />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
