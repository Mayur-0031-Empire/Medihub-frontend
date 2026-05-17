import { DoctorAppointmentFileList } from "@/components/doctor/DoctorAppointmentFileList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { deleteDoctorAppointmentFile, uploadDoctorAppointmentFiles, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { AppointmentDetail, AppointmentFileRef } from "@/types/appointment";
import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

type Props = {
  appointmentId: string;
  files: AppointmentFileRef[];
  onUpdated: (detail: AppointmentDetail) => void;
  compact?: boolean;
  disabled?: boolean;
};

export function DoctorFilesUploadSection({
  appointmentId,
  files,
  onUpdated,
  compact,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [pendingNames, setPendingNames] = useState<string[]>([]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    const selected = input?.files ? [...input.files] : [];
    if (selected.length === 0) {
      notifyError("Choose at least one file to upload.");
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadDoctorAppointmentFiles(appointmentId, selected);
      onUpdated(updated);
      input?.form?.reset();
      setPendingNames([]);
      notifySuccess(
        `Uploaded ${selected.length} file${selected.length === 1 ? "" : "s"}. The patient can open them from this visit.`,
      );
    } catch (err) {
      notifyError(userFacingError(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteFile(file: AppointmentFileRef, index: number) {
    const label = file.title ?? file.name ?? "this file";
    if (!window.confirm(`Remove "${label}" from this visit? The patient will no longer see it.`)) return;
    setDeletingIndex(index);
    try {
      const updated = await deleteDoctorAppointmentFile(appointmentId, file, index);
      onUpdated(updated);
      notifySuccess("File removed.");
    } catch (err) {
      notifyError(userFacingError(err, "Could not delete file."));
    } finally {
      setDeletingIndex(null);
    }
  }

  return (
    <Card className={compact ? "border-slate-200 shadow-sm" : undefined}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileUp className="h-5 w-5 text-primary" aria-hidden />
          Share files with patient
        </CardTitle>
        <CardDescription>
          Upload referrals, summaries, or imaging reports. They appear under &ldquo;Files from your doctor&rdquo; for the
          patient on this visit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shared ({files.length})
            </p>
            <DoctorAppointmentFileList
              files={files}
              deletingIndex={deletingIndex}
              disabled={disabled || uploading || deletingIndex !== null}
              onDelete={(file, index) => void onDeleteFile(file, index)}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No files shared yet for this visit.</p>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`doctor-files-${appointmentId}`}>Add files</Label>
            <input
              ref={inputRef}
              id={`doctor-files-${appointmentId}`}
              type="file"
              name="doctorFiles"
              multiple
              disabled={disabled || uploading || deletingIndex !== null}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
              onChange={(e) => {
                const list = e.target.files ? [...e.target.files] : [];
                setPendingNames(list.map((f) => f.name));
              }}
            />
            {pendingNames.length > 0 ? (
              <p className="text-xs text-slate-600">
                Ready to upload: {pendingNames.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-slate-500">PDF, images, or documents.</p>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={disabled || uploading || deletingIndex !== null || pendingNames.length === 0}
          >
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Upload {pendingNames.length > 0 ? `(${pendingNames.length})` : "files"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
