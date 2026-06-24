import { useState } from "react";
import { motion } from "motion/react";
import { Lock, LogIn } from "lucide-react";
import { Input, Label } from "./ui/Input";
import { Button } from "./ui/Button";
import { useTranslation } from "../i18n/context";
import dudeLogo from "@/DudeLogo.png";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) setError(true);
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-neutral-50 p-4 font-sans text-neutral-900">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-2xl border border-brand-500/10 shadow-xl p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <img src={dudeLogo} alt="Dude" className="h-12 w-auto mb-2" />
          <span className="font-serif text-2xl font-bold text-brand-700 mb-4">
            Dude
          </span>
          <h1 className="text-xl font-serif font-bold text-neutral-900">
            {t("auth.title")}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="login-username">{t("auth.username")}</Label>
            <Input
              id="login-username"
              autoFocus
              autoComplete="username"
              value={username}
              error={error}
              placeholder={t("auth.usernamePlaceholder")}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="login-password">{t("auth.password")}</Label>
            <div className="relative">
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                error={error}
                placeholder="••••••••"
                className="pl-10"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            </div>
          </div>

          {error && (
            <p className="text-sm font-bold text-status-error">
              {t("auth.error")}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            {t("auth.signIn")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
