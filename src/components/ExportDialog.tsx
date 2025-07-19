import { useState } from "react";
import { Download, FileText, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  images?: string[];
  tools?: string[];
  isTyping?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  selectedModel: string;
}

export function ExportDialog({ isOpen, onOpenChange, messages, selectedModel }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'txt' | 'pdf' | 'markdown'>('txt');

  if (!isOpen) return null;

  const generateChatTitle = () => {
    const firstUserMessage = messages.find(m => m.type === 'user')?.content;
    if (firstUserMessage) {
      return firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 50) + "..."
        : firstUserMessage;
    }
    return "Cognix Chat";
  };

  const exportAsText = () => {
    const title = generateChatTitle();
    const timestamp = new Date().toLocaleString();
    
    let content = `# ${title}\n\n`;
    content += `**Generated:** ${timestamp}\n`;
    content += `**Model:** ${selectedModel}\n`;
    content += `**Messages:** ${messages.length}\n\n`;
    content += "---\n\n";

    messages.forEach((message, index) => {
      const role = message.type === 'user' ? 'You' : 'Cognix';
      const time = message.timestamp.toLocaleTimeString();
      
      content += `**${role}** (${time}):\n${message.content}\n\n`;
      
      if (message.tools && message.tools.length > 0) {
        content += `Tools used: ${message.tools.join(', ')}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognix-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    const title = generateChatTitle();
    const timestamp = new Date().toLocaleString();
    
    let content = `# ${title}\n\n`;
    content += `**Generated:** ${timestamp}  \n`;
    content += `**Model:** ${selectedModel}  \n`;
    content += `**Messages:** ${messages.length}  \n\n`;
    content += "---\n\n";

    messages.forEach((message, index) => {
      const role = message.type === 'user' ? '👤 **You**' : '🤖 **Cognix**';
      const time = message.timestamp.toLocaleTimeString();
      
      content += `## ${role} *(${time})*\n\n`;
      content += `${message.content}\n\n`;
      
      if (message.tools && message.tools.length > 0) {
        content += `*Tools used: ${message.tools.join(', ')}*\n\n`;
      }
      
      content += "---\n\n";
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognix-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    // Simple HTML to PDF approach
    const title = generateChatTitle();
    const timestamp = new Date().toLocaleString();
    
    let htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .message { margin-bottom: 30px; padding: 20px; border-radius: 8px; }
            .user { background-color: #f3f4f6; }
            .assistant { background-color: #fef7ff; }
            .meta { font-size: 12px; color: #6b7280; margin-bottom: 10px; }
            .content { line-height: 1.6; }
            .tools { font-style: italic; color: #7c3aed; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p><strong>Generated:</strong> ${timestamp}</p>
            <p><strong>Model:</strong> ${selectedModel}</p>
            <p><strong>Messages:</strong> ${messages.length}</p>
          </div>
    `;

    messages.forEach((message) => {
      const role = message.type === 'user' ? 'You' : 'Cognix';
      const time = message.timestamp.toLocaleTimeString();
      
      htmlContent += `
        <div class="message ${message.type}">
          <div class="meta">${role} • ${time}</div>
          <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
          ${message.tools && message.tools.length > 0 ? 
            `<div class="tools">Tools used: ${message.tools.join(', ')}</div>` : 
            ''
          }
        </div>
      `;
    });

    htmlContent += `
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognix-chat-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'txt':
        exportAsText();
        break;
      case 'markdown':
        exportAsMarkdown();
        break;
      case 'pdf':
        exportAsPDF();
        break;
    }
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl shadow-elevated max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Export Chat</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="space-y-2">
              {[
                { id: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple text format' },
                { id: 'markdown', label: 'Markdown', icon: File, description: 'Formatted markdown file' },
                { id: 'pdf', label: 'PDF (HTML)', icon: Download, description: 'HTML file for PDF conversion' }
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setExportFormat(format.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    exportFormat === format.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <format.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">{format.label}</div>
                    <div className="text-xs text-muted-foreground">{format.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <div><strong>Chat:</strong> {generateChatTitle()}</div>
              <div><strong>Messages:</strong> {messages.length}</div>
              <div><strong>Model:</strong> {selectedModel}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-gradient-ai text-white rounded-lg hover:shadow-glow transition-all"
              disabled={messages.length === 0}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}