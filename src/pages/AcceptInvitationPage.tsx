import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import {
  Mail,
  Lock,
  Loader2,
  UserPlus,
  User,
  Building2,
  Shield,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface InvitationDetails {
  valid: boolean;
  email?: string;
  company_name?: string;
  role_name?: string;
  expires_at?: string;
  error?: string;
}

export const AcceptInvitationPage = () => {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // State
  const [isValidating, setIsValidating] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setInvitation({ valid: false, error: t('acceptInvitation.errors.noToken') });
        setIsValidating(false);
        return;
      }

      try {
        const response = await apiFetch(`/api/v1/invitations/validate/${token}`);
        const data = await response.json();
        setInvitation(data);
      } catch (error) {
        setInvitation({ valid: false, error: t('acceptInvitation.errors.validationFailed') });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('acceptInvitation.errors.title'),
        description: t('acceptInvitation.errors.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t('acceptInvitation.errors.title'),
        description: t('acceptInvitation.errors.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/v1/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: t('acceptInvitation.success.title'),
          description: t('acceptInvitation.success.description'),
        });
        // Redirect to login after 2 seconds
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('acceptInvitation.errors.acceptFailed'));
      }
    } catch (error: any) {
      toast({
        title: t('acceptInvitation.errors.title'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">{t('acceptInvitation.validating')}</p>
        </div>
      </div>
    );
  }

  // Invalid or expired invitation
  if (!invitation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-400/20 dark:from-red-600/10 dark:to-orange-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-400/20 to-pink-400/20 dark:from-red-600/10 dark:to-pink-600/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="mx-auto max-w-md w-full relative z-10 border-red-200 dark:border-red-800 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 dark:from-red-600 dark:to-orange-700 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              {t('acceptInvitation.invalid.title')}
            </CardTitle>
            <CardDescription className="text-base dark:text-gray-400">
              {invitation?.error || t('acceptInvitation.invalid.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('acceptInvitation.invalid.contactAdmin')}
            </p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                {t('acceptInvitation.goToLogin')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 dark:from-green-600/10 dark:to-emerald-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-teal-400/20 dark:from-green-600/10 dark:to-teal-600/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="mx-auto max-w-md w-full relative z-10 border-green-200 dark:border-green-800 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {t('acceptInvitation.success.title')}
            </CardTitle>
            <CardDescription className="text-base dark:text-gray-400">
              {t('acceptInvitation.success.redirecting')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-green-600 dark:text-green-400 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acceptance form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="mx-auto max-w-md w-full relative z-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('acceptInvitation.title')}
          </CardTitle>
          <CardDescription className="text-base dark:text-gray-400">
            {t('acceptInvitation.subtitle')}
          </CardDescription>

          {/* Invitation Details */}
          <div className="pt-2 space-y-2">
            {invitation.company_name && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Building2 className="h-4 w-4" />
                <span>{invitation.company_name}</span>
              </div>
            )}
            {invitation.role_name && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4" />
                <span>{invitation.role_name}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-5">
            {/* Email (read-only) */}
            <div className="grid gap-2">
              <Label htmlFor="email" className={`dark:text-gray-300 flex items-center gap-2`}>
                <Mail className="h-4 w-4" />
                {t('acceptInvitation.form.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={invitation.email || ""}
                disabled
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-gray-400 h-11 bg-slate-100"
              />
            </div>

            {/* First Name */}
            <div className="grid gap-2">
              <Label htmlFor="firstName" className={`dark:text-gray-300 flex items-center gap-2`}>
                <User className="h-4 w-4" />
                {t('acceptInvitation.form.firstName')}
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('acceptInvitation.form.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
              />
            </div>

            {/* Last Name */}
            <div className="grid gap-2">
              <Label htmlFor="lastName" className={`dark:text-gray-300 flex items-center gap-2`}>
                <User className="h-4 w-4" />
                {t('acceptInvitation.form.lastName')}
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('acceptInvitation.form.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password" className={`dark:text-gray-300 flex items-center gap-2`}>
                <Lock className="h-4 w-4" />
                {t('acceptInvitation.form.password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('acceptInvitation.form.passwordHint')}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className={`dark:text-gray-300 flex items-center gap-2`}>
                <Lock className="h-4 w-4" />
                {t('acceptInvitation.form.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`h-5 w-5 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('acceptInvitation.form.creating')}
                </>
              ) : (
                <>
                  <UserPlus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('acceptInvitation.form.createAccount')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('acceptInvitation.alreadyHaveAccount')}{" "}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {t('acceptInvitation.signIn')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
