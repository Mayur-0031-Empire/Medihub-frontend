import { LoginHeroDoctor } from "@/components/brand/LoginHeroDoctor";
import { PortalRolePicker } from "@/components/auth/PortalRolePicker";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { DocumentTitle } from "@/components/layout/DocumentTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCurrentUser, isServerConfigured, loginWithPassword } from "@/lib/api";
import { SERVICE_UNAVAILABLE_AUTH, userFacingError } from "@/lib/userMessages";
import { dashboardHomePath, safeDashboardReturnTo } from "@/lib/dashboardPaths";
import { notifyError } from "@/lib/notify";
import { normalizePortalRole, portalFromSearchString, registerPathForRole } from "@/lib/auth";
import type { PortalRole } from "@/types/auth";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serverOk = isServerConfigured();

  const [portal, setPortal] = useState<PortalRole>(() =>
    typeof window !== "undefined" ? portalFromSearchString(window.location.search) : "patient",
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = normalizePortalRole(searchParams.get("portal"));
    if (p) setPortal(p);
  }, [searchParams]);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    if (!serverOk) {
      notifyError(SERVICE_UNAVAILABLE_AUTH);
      return;
    }
    if (!identifier.trim() || !password) {
      notifyError("Enter your email or username and password.");
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(identifier.trim(), password);
      const user = await fetchCurrentUser();
      const actual = normalizePortalRole(user.role);
      if (!actual) {
        throw new Error("Your account has an unknown role. Contact support.");
      }
      if (actual !== portal) {
        throw new Error(
          `This account is a ${actual}. Switch “Sign in as” to ${actual} or use a different account.`,
        );
      }
      const returnTo = safeDashboardReturnTo(searchParams.get("returnTo"));
      navigate(returnTo ?? dashboardHomePath(actual), { replace: true });
    } catch (err) {
      notifyError(userFacingError(err, "Sign-in failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DocumentTitle title="Sign in" />
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-100 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:py-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-slate-400/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 lg:flex-row lg:items-center lg:gap-14 lg:px-8">
          <section className="flex w-full flex-1 items-center justify-center lg:max-w-xl lg:flex-1">
            <LoginHeroDoctor />
          </section>

          <section className="relative z-10 w-full shrink-0 lg:max-w-md">
            <Card className="border-slate-200/80 bg-card/95 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:shadow-black/30">
              <CardHeader>
                <CardTitle className="text-xl">Sign in</CardTitle>
                <CardDescription>Use your MediHub account.</CardDescription>
              </CardHeader>
              <CardContent>
                {!serverOk ? (
                  <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100" role="status">
                    <AlertDescription>{SERVICE_UNAVAILABLE_AUTH}</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier">Email or username</Label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                          aria-hidden
                        />
                        <Input
                          id="identifier"
                          name="identifier"
                          type="text"
                          autoComplete="username"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          disabled={loading}
                          className="h-10 rounded-xl bg-muted/60 pl-10"
                          placeholder="you@clinic.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                          aria-hidden
                        />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="h-10 rounded-xl bg-slate-50/80 pl-10 pr-11"
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !serverOk}
                    className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-teal-600/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden />
                        Signing in…
                      </>
                    ) : (
                      "Sign in with email"
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <PortalRolePicker value={portal} onChange={setPortal} disabled={loading} />
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs font-medium uppercase">
                    <span className="bg-card px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                    Continue with Google
                  </p>
                  <SocialAuthButtons portal={portal} disabled={loading || !serverOk} googleOnly />
                </div>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                  New to MediHub?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 font-semibold text-teal-700 dark:text-teal-400"
                    onClick={() => navigate(registerPathForRole(portal))}
                  >
                    Create an account
                  </Button>
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
