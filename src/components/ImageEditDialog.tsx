
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editImage } from "@/services/aiService";
import { Loader2, Wand2 } from "lucide-react";

interface ImageEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onEditComplete: (editedImageUrl: string, editPrompt: string) => void;
}

export function ImageEditDialog({ 
  isOpen, 
  onOpenChange, 
  imageUrl, 
  onEditComplete 
}: ImageEditDialogProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;

    setIsEditing(true);
    try {
      const editedImageUrl = await editImage(imageUrl, editPrompt);
      onEditComplete(editedImageUrl, editPrompt);
      onOpenChange(false);
      setEditPrompt("");
    } catch (error) {
      console.error('Error editing image:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const suggestedEdits = [
    "Remove the background",
    "Change the background to a sunset scene",
    "Make it more colorful and vibrant",
    "Add a vintage filter effect",
    "Remove unwanted objects",
    "Change the lighting to golden hour"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Edit Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image preview */}
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Image to edit"
              className="max-w-full max-h-64 object-contain rounded-lg border border-border"
            />
          </div>

          {/* Edit prompt input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe your edits:</label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., Remove the background, change the lighting, add objects..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Suggested edits */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Quick suggestions:</label>
            <div className="flex flex-wrap gap-2">
              {suggestedEdits.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setEditPrompt(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isEditing}
              className="bg-gradient-ai text-white"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Edit Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
