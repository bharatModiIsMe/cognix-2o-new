
import { useState } from "react";
import { X, User, Mail, Settings, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AI_MODELS } from "@/services/aiService";
import { logout } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ProfilePopup({ isOpen, onClose, selectedModel, onModelChange }: ProfilePopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [defaultModel, setDefaultModel] = useState(selectedModel);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModelChange = (modelId: string) => {
    setDefaultModel(modelId);
    onModelChange(modelId);
    localStorage.setItem('defaultModel', modelId);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h3>
            
            <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-ai flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="flex-1">
                <p className="font-medium">{user.displayName || 'Anonymous User'}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign-in method: {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4" />
                  Default AI Model
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full p-3 bg-surface border border-border rounded-lg focus:border-primary outline-none"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.badge && `(${model.badge})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full p-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
