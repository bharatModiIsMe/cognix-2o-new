
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Shield, Sparkles, ArrowRight, Mail, Chrome } from "lucide-react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

interface LandingPageProps {
  onAuthSuccess: () => void;
}

export function LandingPage({ onAuthSuccess }: LandingPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome to Cognix!",
        description: "Successfully signed in with Google.",
      });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast({
          title: "Account Created!",
          description: "Welcome to Cognix! Your account has been created successfully.",
        });
      } else {
        await signInWithEmail(email, password);
        toast({
          title: "Welcome Back!",
          description: "Successfully signed in to Cognix.",
        });
      }
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: error.message || `Failed to ${isSignUp ? 'create account' : 'sign in'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: "Advanced AI Models",
      description: "Access to GPT-4o, Gemini 2.5 Pro, DeepSeek V3, and more cutting-edge AI models"
    },
    {
      icon: Zap,
      title: "Real-time Web Search",
      description: "Get up-to-date information with integrated web search capabilities"
    },
    {
      icon: Sparkles,
      title: "Image Generation & Editing",
      description: "Create and edit images with FLUX, Imagen, and other advanced models"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations and data are protected with enterprise-grade security"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              🚀 Powered by Advanced AI
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
              Meet Cognix
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your intelligent AI assistant powered by multiple advanced models. Chat, search, create images, and get real-time information all in one place.
            </p>

            {/* Auth Card */}
            <Card className="max-w-md mx-auto mb-16 border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
                <CardDescription>
                  {isSignUp ? "Join thousands of users using Cognix" : "Welcome back to Cognix"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
                
                <p className="text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Cognix?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of AI assistance with our comprehensive suite of features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already experiencing the power of advanced AI assistance.
          </p>
          <Button size="lg" className="bg-gradient-ai text-white hover:shadow-glow">
            Start Your AI Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
