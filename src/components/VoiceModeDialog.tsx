
import { useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VoiceModeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMicOn: boolean;
  onMicToggle: () => void;
  onStopAI: () => void;
}

export function VoiceModeDialog({ 
  isOpen, 
  onOpenChange, 
  isMicOn, 
  onMicToggle, 
  onStopAI 
}: VoiceModeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Mode Controls</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <button
            onClick={onMicToggle}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              isMicOn 
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            {isMicOn ? (
              <>
                <Mic className="w-5 h-5" />
                <div>
                  <div className="font-medium">Microphone On</div>
                  <div className="text-sm opacity-75">Click to turn off</div>
                </div>
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5" />
                <div>
                  <div className="font-medium">Microphone Off</div>
                  <div className="text-sm opacity-75">Click to turn on</div>
                </div>
              </>
            )}
          </button>
          
          <button
            onClick={onStopAI}
            className="flex items-center gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <Square className="w-5 h-5" />
            <div>
              <div className="font-medium">Stop AI Response</div>
              <div className="text-sm opacity-75">Stop current AI generation</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
