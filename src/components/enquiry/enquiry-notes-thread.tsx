"use client";

import { useState, useTransition } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  GitCommit,
  DollarSign,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EnquiryNote, NoteType } from "@/lib/queries/enquiries";

interface EnquiryNotesThreadProps {
  enquiryId: string;
  notes: EnquiryNote[];
  onAddNote: (content: string, noteType: NoteType) => Promise<void>;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNoteIcon(noteType: NoteType) {
  switch (noteType) {
    case "phone_call":
      return Phone;
    case "email":
      return Mail;
    case "note":
      return MessageSquare;
    case "status_change":
      return GitCommit;
    case "quote_created":
      return DollarSign;
    case "system":
      return GitCommit;
    default:
      return MessageSquare;
  }
}

function isSystemNote(noteType: NoteType): boolean {
  return ["system", "status_change", "quote_created"].includes(noteType);
}

export function EnquiryNotesThread({
  enquiryId,
  notes,
  onAddNote,
}: EnquiryNotesThreadProps) {
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("note");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    startTransition(async () => {
      await onAddNote(newNote.trim(), noteType);
      setNewNote("");
      setNoteType("note");
    });
  };

  return (
    <div className="space-y-4">
      {/* Activity feed */}
      <div className="space-y-3">
        {notes.length > 0 ? (
          notes.map((note) => {
            const Icon = getNoteIcon(note.note_type);
            const isSystem = isSystemNote(note.note_type);

            return (
              <div
                key={note.id}
                className={cn(
                  "flex gap-3 rounded-lg border p-3",
                  isSystem
                    ? "bg-neutral-50 border-neutral-200"
                    : "bg-white border-olive-200"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isSystem ? "bg-neutral-200" : "bg-olive-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isSystem ? "text-neutral-600" : "text-olive-700"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-olive-900">
                      {note.author_name}
                    </span>
                    <span className="text-xs text-olive-500">
                      {formatRelativeTime(note.created_at)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm whitespace-pre-wrap",
                      isSystem
                        ? "text-neutral-600 italic"
                        : "text-olive-800"
                    )}
                  >
                    {note.content}
                  </p>
                  {/* Show metadata for status changes */}
                  {note.note_type === "status_change" && note.metadata?.from_status && (
                    <div className="mt-1 text-xs text-neutral-500">
                      {note.metadata.from_status} → {note.metadata.to_status}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-sm text-neutral-500">
            No activity yet. Add the first note to start tracking this enquiry.
          </div>
        )}
      </div>

      {/* New note form */}
      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        <div className="flex gap-2">
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
            disabled={isPending}
            className="rounded-md border border-olive-200 bg-white px-3 py-2 text-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          >
            <option value="note">Note</option>
            <option value="phone_call">Phone Call</option>
            <option value="email">Email Log</option>
          </select>
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note, log a call, or record an email..."
            className="flex-1"
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !newNote.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
