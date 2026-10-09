"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EventCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitEvent: (eventText: string) => void;
}

export function EventCreatorDialog({
  open,
  onOpenChange,
  onSubmitEvent,
}: EventCreatorDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!date) {
      toast.error("Please choose a date for the event");
      return;
    }

    const formattedEvent = [
      `📅 **EVENT: ${title.trim()}**`,
      `🗓 Date: ${date}${time ? ` at ${time}` : ""}`,
      location.trim() ? `📍 Location / Link: ${location.trim()}` : "",
      description.trim() ? `📝 Details: ${description.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    onSubmitEvent(formattedEvent);
    onOpenChange(false);
    // Reset state
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    toast.success("Event invitation created");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Schedule an Event</DialogTitle>
              <p className="text-xs text-muted-foreground">Share an invitation with date and location</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Event Title
            </label>
            <Input
              placeholder="e.g. Design Sync / Weekend Hangout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl text-xs h-9"
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Time
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Location / Video Link
            </label>
            <Input
              placeholder="e.g. Coffee House or Google Meet Link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl text-xs h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Add any agenda notes or prep items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20"
            >
              Post Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
