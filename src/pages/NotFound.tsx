import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/contexts/LocaleContext";

const NotFound = () => {
  const location = useLocation();
  const { messages } = useLocale();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{messages.notFound.description}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {messages.notFound.backHome}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
