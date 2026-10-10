"use client";

import { useState } from "react";
import { BarChart2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface PollCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitPoll: (pollText: string) => void;
}

export function PollCreatorDialog({
  open,
  onOpenChange,
  onSubmitPoll,
}: PollCreatorDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  function handleAddOption() {
    if (options.length >= 6) {
      toast.info("Maximum 6 options allowed");
      return;
    }
    setOptions((prev) => [...prev, ""]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) {
      toast.info("Poll must have at least 2 options");
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOptionChange(index: number, val: string) {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 non-empty options");
      return;
    }

    const formattedPoll = [
      `📊 **POLL: ${question.trim()}**`,
      allowMultiple ? "*(Multiple answers allowed)*" : "*(Single answer)*",
      "",
      ...validOptions.map((opt, idx) => `${idx + 1}. ⬜ ${opt}`),
    ].join("\n");

    onSubmitPoll(formattedPoll);
    onOpenChange(false);
    // Reset state
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    toast.success("Poll published to conversation");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <BarChart2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Create a Poll</DialogTitle>
              <p className="text-xs text-muted-foreground">Ask a question to collect votes</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Question
            </label>
            <Input
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="rounded-xl text-xs h-9"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="rounded-xl text-xs h-9 flex-1"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="size-8 grid place-items-center text-muted-foreground hover:text-destructive transition rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full rounded-xl text-xs font-semibold gap-1.5 h-8 border-dashed"
              >
                <Plus className="size-3.5" />
                <span>Add Option</span>
              </Button>
            )}
          </div>

          {/* Multiple answers toggle */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Allow multiple answers</p>
              <p className="text-[10px] text-muted-foreground">Participants can select more than one option</p>
            </div>
            <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          </div>

          {/* Submit */}
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
              className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              Create Poll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
