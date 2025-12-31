"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";
import { addMealJobComment } from "@/app/(app)/(admin)/admin/catering/jobs/actions";

interface CommentsThreadProps {
  mealJobId: string;
  comments: MealJobCommentWithAuthor[];
  currentUserRole: "admin" | "caterer";
}

function formatRelativeTime(date: Date): string {
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

export function CommentsThread({
  mealJobId,
  comments,
  currentUserRole,
}: CommentsThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(comments.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    startTransition(async () => {
      await addMealJobComment(mealJobId, newComment.trim());
      setNewComment("");
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-olive-700 hover:text-olive-900 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-3 rounded-lg border border-olive-100 bg-olive-50/50 p-3">
          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "rounded-lg p-2 text-sm",
                    comment.authorRole === "admin"
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "bg-white border-l-2 border-olive-300"
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-olive-600 mb-1">
                    <span className="font-medium">
                      {comment.authorName}
                      <span className="ml-1 text-olive-400">
                        ({comment.authorRole === "admin" ? "Admin" : "Caterer"})
                      </span>
                    </span>
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-olive-800 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-olive-500 text-center py-2">
              No comments yet. Start the conversation.
            </p>
          )}

          {/* New comment form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending || !newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
