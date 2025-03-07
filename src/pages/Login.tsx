
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook } from 'lucide-react';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate login process for now
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll just navigate to workspace
      toast.success('Successfully logged in');
      navigate('/workspace');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMetaLogin = () => {
    toast('Meta login integration coming soon');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <AnimatedGradient />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-gradient inline-block">
            CampaignSync
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        
        <div className="glass-morphism rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-11 relative"
            onClick={handleMetaLogin}
          >
            <Facebook className="h-5 w-5 text-[#1877F2] absolute left-4" />
            <span>Sign in with Meta</span>
          </Button>
          
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
