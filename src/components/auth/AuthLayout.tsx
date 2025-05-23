
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Background matching landing page */}
      <div 
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/6b1600fa-ac63-4959-a5f9-335e57be0781.png')`
        }}
      ></div>

      {/* Auth Form Container */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AuthHeader />
        <AuthForm />
      </div>
    </div>
  );
}
