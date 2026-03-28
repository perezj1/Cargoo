import { Download, Plus, Share, Smartphone } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useAppInstallPrompt } from "@/hooks/use-app-install-prompt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AppInstallPrompt = ({ enabled }: { enabled: boolean }) => {
  const { profile } = useAuth();
  const { messages } = useLocale();
  const { closePrompt, handleInstall, installing, isAndroid, isIos, isStandalone, open, setOpen } = useAppInstallPrompt({ enabled });
  const description = profile?.isTraveler ? messages.installPrompt.travelerDescription : messages.installPrompt.senderDescription;

  if (!enabled || isStandalone || (!isIos && !isAndroid)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closePrompt())}>
      <DialogContent className="max-w-md rounded-2xl p-0">
        <div className="rounded-t-2xl bg-primary/6 px-6 py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl">{messages.installPrompt.title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {isIos ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{messages.installPrompt.iosIntro}</p>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Share className="h-4 w-4 text-primary" />
                  {messages.installPrompt.iosStep1Title}
                </div>
                <p className="mt-1">{messages.installPrompt.iosStep1Text}</p>
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Plus className="h-4 w-4 text-primary" />
                  {messages.installPrompt.iosStep2Title}
                </div>
                <p className="mt-1">{messages.installPrompt.iosStep2Text}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{messages.installPrompt.androidIntro}</p>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Download className="h-4 w-4 text-primary" />
                  {messages.installPrompt.androidDirectTitle}
                </div>
                <p className="mt-1">{messages.installPrompt.androidDirectText}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            {isAndroid ? (
              <Button className="w-full gap-2" size="lg" onClick={() => void handleInstall()} disabled={installing}>
                <Download className="h-4 w-4" />
                {installing ? messages.installPrompt.installing : messages.installPrompt.install}
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={closePrompt}>
              {messages.installPrompt.later}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppInstallPrompt;
