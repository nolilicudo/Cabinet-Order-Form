import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Logs } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    login.mutate(values);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#e8e3d5] opacity-50" />
        <div className="absolute -bottom-48 -left-24 h-[400px] w-[400px] rounded-full bg-[#dde8e0] opacity-40" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-[28px] border border-[#e5e0d4] bg-white shadow-[0_24px_60px_rgba(48,55,39,.10)] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0d3b26] px-8 pt-10 pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Logs size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium text-white/70 tracking-wide uppercase">Design Your Price</span>
            </div>
            <h1 className="font-serif text-3xl font-normal text-white leading-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Sign in to your cabinet operations account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold tracking-wide uppercase text-[#6b7872]">
                Email address
              </Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aab9f]" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9 h-11 border-[#dcd8d0] bg-[#faf9f6] focus-visible:ring-[#0d3b26]/30 focus-visible:border-[#0d3b26]"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs font-semibold tracking-wide uppercase text-[#6b7872]">
                Password
              </Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aab9f]" />
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 h-11 border-[#dcd8d0] bg-[#faf9f6] focus-visible:ring-[#0d3b26]/30 focus-visible:border-[#0d3b26]"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              id="login-submit"
              type="submit"
              disabled={isSubmitting || login.isPending}
              className="w-full h-11 bg-[#0d3b26] hover:bg-[#12462d] text-white font-medium mt-2 transition-colors"
            >
              {login.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <p className="text-center text-xs text-[#8fa098] pt-1">
              Contact your administrator to get access.
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#9aab9f]">
          Woodoo Cabinet Operations · Design Your Price
        </p>
      </div>
    </div>
  );
}
