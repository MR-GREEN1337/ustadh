"use client";

import { useState } from "react";
import { Bug, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/i18n/client";
import { BugReportService } from "@/services/BugReportService";

export function BugReportDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation(); // Initialize the translation hook
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Collect system information
  const systemInfo = {
    browser: typeof window !== "undefined" ? window.navigator.userAgent : "",
    screen: typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "",
    url: typeof window !== "undefined" ? window.location.href : "",
    userId: user?.id || t("bugReport.notLoggedIn"),
    userType: user?.user_type || t("bugReport.unknown"),
    timestamp: new Date().toISOString(),
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError(t("bugReport.errors.emptyDescription"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await BugReportService.submitBugReport({
        description,
        systemInfo,
      });

      toast({
        title: t("bugReport.success.title"),
        description: t("bugReport.success.description"),
      });

      setIsOpen(false);
      setDescription("");
    } catch (err) {
      console.error("Failed to submit bug report:", err);
      setError(t("bugReport.errors.submitFailedTryAgain"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("bugReport.title")}</DialogTitle>
          <DialogDescription>
            {t("bugReport.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder={t("bugReport.inputPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="resize-none"
          />

          <div className="rounded-md bg-muted p-3">
            <h4 className="mb-2 text-sm font-medium">{t("bugReport.systemInfo.title")}</h4>
            <div className="text-xs text-muted-foreground">
              <p>{t("bugReport.systemInfo.userId")}: {systemInfo.userId}</p>
              <p>{t("bugReport.systemInfo.userType")}: {systemInfo.userType}</p>
              <p>{t("bugReport.systemInfo.url")}: {systemInfo.url}</p>
              <p>{t("bugReport.systemInfo.browser")}: {systemInfo.browser.substring(0, 50)}...</p>
              <p>{t("bugReport.systemInfo.screenResolution")}: {systemInfo.screen}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            {t("bugReport.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("bugReport.buttons.submitting") : t("bugReport.buttons.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
